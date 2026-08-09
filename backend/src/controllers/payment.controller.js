const cartModel = require('../models/cart.model');
const foodPartnerModel = require('../models/foodpartner.model');
const Order = require('../models/order.model');
const { calculateOrderPricing } = require('../services/OrderPricingService');
const CommissionService = require('../services/CommissionService');
const SettlementService = require('../services/SettlementService');
const PaymentProviderService = require('../services/PaymentProviderService');
const FinancialLedgerService = require('../services/FinancialLedgerService');
const OrderStateMachineService = require('../services/OrderStateMachineService');
const RefundService = require('../services/RefundService');
const WebhookService = require('../services/WebhookService');

// Create Payment Order Endpoint (Checkout)
async function createPaymentOrder(req, res) {
    try {
        const { deliveryAddress, paymentMethod = 'Razorpay', deliveryOption = 'Normal Delivery', couponCode = '' } = req.body;

        // 1. Backend Cart Validation
        let cartItems = [];
        const cart = await cartModel.findOne({ user: req.user._id }).populate('items.food');
        if (cart && cart.items && cart.items.length > 0) {
            cartItems = cart.items;
        } else if (Array.isArray(req.body.items) && req.body.items.length > 0) {
            cartItems = req.body.items;
        }

        if (cartItems.length === 0) {
            return res.status(400).json({ message: "Your cart is empty. Please add items to your cart before placing an order." });
        }

        let partnerId = cart?.foodPartner || cartItems[0]?.food?.foodPartner || cartItems[0]?.foodPartner || cartItems[0]?.foodPartnerId;
        if (!partnerId) {
            const defaultPartner = await foodPartnerModel.findOne({ approvalStatus: 'approved' }) || await foodPartnerModel.findOne();
            if (defaultPartner) partnerId = defaultPartner._id;
        }

        if (partnerId) {
            const partner = await foodPartnerModel.findById(partnerId);
            if (partner && partner.isOnline === false) {
                return res.status(400).json({ message: "Restaurant is currently closed. Orders cannot be accepted." });
            }
        }

        let addressObj = deliveryAddress;
        if (!addressObj || !addressObj.street || !addressObj.city) {
            const AddressModel = require('../models/address.model');
            const savedAddr = await AddressModel.findOne({ user: req.user._id });
            if (savedAddr) {
                addressObj = savedAddr.toObject();
            } else {
                addressObj = {
                    label: 'Home',
                    fullName: req.user.fullName || 'Customer',
                    phone: req.user.phone || '9999999999',
                    houseNumber: '12',
                    street: 'Main Street',
                    area: 'Central',
                    city: 'Delhi',
                    state: 'Delhi',
                    pincode: '110001'
                };
            }
        }

        // 2. Server-side Price Recalculation in Paise
        const { processedItems, pricing } = await calculateOrderPricing({
            items: cartItems,
            foodPartnerId: partnerId,
            deliveryOption,
            couponCode
        });

        // 3. Commission Calculation Snapshot
        const commissionResult = await CommissionService.calculateCommission({
            foodSubtotalPaise: pricing.foodSubtotalPaise,
            totalAmountPaise: pricing.totalAmountPaise
        });

        // 4. Restaurant Settlement Calculation Snapshot
        const settlementResult = SettlementService.calculateSettlement({
            pricing,
            commission: commissionResult.snapshot
        });

        const orderNumber = 'ZST-' + Math.floor(100000 + Math.random() * 900000);
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // 5. Create Payment Gateway Order
        const gatewayOrder = await PaymentProviderService.createPaymentOrder({
            amountPaise: pricing.totalAmountPaise,
            currency: pricing.currency,
            orderId: orderNumber
        });

        // 6. Save Pending Order with Immutable Snapshots
        const order = await Order.create({
            orderNumber,
            customer: req.user._id,
            foodPartner: partnerId,
            items: processedItems,
            deliveryAddress: addressObj,
            pricing,
            commission: commissionResult.snapshot,
            settlement: {
                restaurantAmountPaise: settlementResult.restaurantAmountPaise,
                restaurantStatus: 'PENDING',
                platformAmountPaise: settlementResult.platformAmountPaise,
                platformStatus: 'PENDING',
                deliveryPartnerAmountPaise: settlementResult.deliveryPartnerAmountPaise,
                deliveryPartnerStatus: 'RESERVED'
            },
            financialBreakdown: settlementResult.financialBreakdown,
            couponCode,
            deliveryOption,
            payment: {
                method: paymentMethod,
                gateway: gatewayOrder.gateway,
                gatewayOrderId: gatewayOrder.gatewayOrderId,
                amountPaise: pricing.totalAmountPaise,
                currency: pricing.currency,
                status: 'PENDING'
            },
            status: 'PAYMENT_PENDING',
            otp,
            timeline: [{ status: 'PAYMENT_PENDING', timestamp: new Date() }]
        });

        // Clear Cart upon successful order creation
        cart.items = [];
        cart.foodPartner = null;
        cart.subtotal = 0;
        await cart.save();

        res.status(201).json({
            message: "Payment order created successfully",
            orderId: order._id,
            orderNumber: order.orderNumber,
            gatewayOrderId: gatewayOrder.gatewayOrderId,
            amount: pricing.totalAmountPaise, // in paise
            amountRupees: pricing.grandTotal, // for display
            currency: pricing.currency,
            publicConfig: gatewayOrder.publicConfig
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Verify Payment Endpoint
async function verifyPayment(req, res) {
    try {
        const { orderId, gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if user owns order
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Forbidden: Order does not belong to user" });
        }

        // Idempotent check
        if (order.payment.status === 'PAID' || order.payment.status === 'Completed') {
            return res.status(200).json({
                message: "Payment already verified",
                order
            });
        }

        // Signature Verification
        const isValid = PaymentProviderService.verifyPaymentSignature({
            gatewayOrderId: gatewayOrderId || order.payment.gatewayOrderId,
            gatewayPaymentId,
            gatewaySignature
        });

        if (!isValid) {
            return res.status(400).json({ message: "Invalid payment signature verification failed" });
        }

        // Update Payment Metadata
        order.payment.gatewayPaymentId = gatewayPaymentId || `pay_${Date.now()}`;
        order.payment.gatewaySignature = gatewaySignature || 'sig_verified';
        order.payment.status = 'PAID';
        order.payment.verifiedAt = new Date();
        await order.save();

        // Record Ledger Entry
        await FinancialLedgerService.recordCustomerPayment({
            order,
            paymentId: gatewayPaymentId || order.payment.gatewayOrderId,
            gateway: order.payment.gateway || 'PAYMENT_GATEWAY'
        });

        // Order State Transition
        const updatedOrder = await OrderStateMachineService.transition(order._id, 'PAID');

        res.status(200).json({
            message: "Payment verified successfully",
            order: updatedOrder
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Payment Gateway Webhook Listener
async function handlePaymentWebhook(req, res) {
    try {
        const rawBody = req.rawBody || req.body;
        const result = await WebhookService.handlePaymentWebhook({
            rawBody,
            headers: req.headers,
            body: req.body
        });

        res.status(200).json({ status: "ok", result });
    } catch (err) {
        res.status(400).json({ status: "error", message: err.message });
    }
}

// Order Refund Endpoint
async function initiateRefund(req, res) {
    try {
        const { orderId, reason } = req.body;
        const result = await RefundService.processRefund({
            orderId,
            reason: reason || 'Refund requested',
            requestedBy: req.userRole || 'USER'
        });

        res.status(200).json({ message: "Refund processed successfully", result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    createPaymentOrder,
    verifyPayment,
    handlePaymentWebhook,
    initiateRefund
};
