const orderModel = require('../models/order.model');
const cartModel = require('../models/cart.model');
const couponModel = require('../models/coupon.model');
const reviewModel = require('../models/review.model');
const foodPartnerModel = require('../models/foodpartner.model');
const { assignNearestDeliveryPartner } = require('./delivery.controller');
const { calculateOrderPricing } = require('../services/OrderPricingService');
const CommissionService = require('../services/CommissionService');
const SettlementService = require('../services/SettlementService');
const OrderStateMachineService = require('../services/OrderStateMachineService');
const FinancialLedgerService = require('../services/FinancialLedgerService');
const RefundService = require('../services/RefundService');

// Place Order / Checkout (Supports COD and Legacy direct checkout)
async function createOrder(req, res) {
    try {
        const { deliveryAddress, paymentMethod = 'COD', deliveryOption = 'Normal Delivery', couponCode = '' } = req.body;

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

        // Server-Side Pricing Recalculation in Paise
        const { processedItems, pricing } = await calculateOrderPricing({
            items: cartItems,
            foodPartnerId: partnerId,
            deliveryOption,
            couponCode
        });

        // Commission Snapshot
        const commissionResult = await CommissionService.calculateCommission({
            foodSubtotalPaise: pricing.foodSubtotalPaise,
            totalAmountPaise: pricing.totalAmountPaise
        });

        // Settlement Snapshot
        const settlementResult = SettlementService.calculateSettlement({
            pricing,
            commission: commissionResult.snapshot
        });

        const orderNumber = 'ZST-' + Math.floor(100000 + Math.random() * 900000);
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const isCod = paymentMethod === 'COD';
        const initialStatus = isCod ? 'RESTAURANT_PENDING' : 'PAYMENT_PENDING';
        const paymentStatus = isCod ? 'Pending' : 'PAID';

        const order = await orderModel.create({
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
                gateway: isCod ? 'COD' : 'Razorpay',
                gatewayOrderId: `ord_cod_${Date.now()}`,
                amountPaise: pricing.totalAmountPaise,
                currency: pricing.currency,
                status: paymentStatus,
                transactionId: isCod ? '' : 'TXN-' + Date.now()
            },
            status: initialStatus,
            otp,
            timeline: [{ status: initialStatus, timestamp: new Date() }]
        });

        // Clear user cart
        cart.items = [];
        cart.foodPartner = null;
        cart.subtotal = 0;
        await cart.save();

        if (isCod) {
            // Record COD Customer Payment & Delivery Reservation in Ledger
            await FinancialLedgerService.recordCustomerPayment({
                order,
                paymentId: `COD-${order.orderNumber}`,
                gateway: 'COD'
            });
        }

        res.status(201).json({ message: "Order placed successfully", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Get User Orders
async function getUserOrders(req, res) {
    try {
        const orders = await orderModel.find({ customer: req.user._id })
            .populate('foodPartner', 'name email location rating')
            .populate('deliveryPartner', 'name phone rating currentLocation')
            .sort({ createdAt: -1 });

        res.status(200).json({ orders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Get Order Details by ID
async function getOrderById(req, res) {
    try {
        const { orderId } = req.params;
        const order = await orderModel.findById(orderId)
            .populate('customer', 'fullName email phone')
            .populate('foodPartner', 'name email location rating')
            .populate('deliveryPartner', 'name phone rating currentLocation');

        if (!order) return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Cancel Order (by Customer, if before preparation)
async function cancelOrder(req, res) {
    try {
        const { orderId } = req.params;
        const order = await orderModel.findOne({ _id: orderId, customer: req.user._id });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (['Preparing', 'PREPARING', 'Ready', 'READY_FOR_PICKUP', 'Picked Up', 'PICKED_UP', 'Out for Delivery', 'OUT_FOR_DELIVERY', 'Delivered', 'DELIVERED'].includes(order.status)) {
            return res.status(400).json({ message: "Order cannot be cancelled after kitchen preparation has started" });
        }

        const reason = req.body.reason || 'Cancelled by user';

        // Trigger State Machine Transition to CANCELLED
        const updatedOrder = await OrderStateMachineService.transition(order._id, 'CANCELLED', { reason });

        // Trigger Refund if payment was completed
        if (order.payment.status === 'PAID' || order.payment.status === 'Completed') {
            await RefundService.processRefund({ orderId: order._id, reason, requestedBy: 'CUSTOMER' });
        }

        res.status(200).json({ message: "Order cancelled successfully", order: updatedOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Restaurant Incoming Orders
async function getRestaurantOrders(req, res) {
    try {
        const orders = await orderModel.find({ foodPartner: req.foodPartner._id })
            .populate('customer', 'fullName email phone')
            .populate('deliveryPartner', 'name phone rating')
            .sort({ createdAt: -1 });

        res.status(200).json({ orders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Restaurant Order Status Update (Accept, Prepare, Ready, Reject)
async function updateRestaurantOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // 'Accepted', 'Preparing', 'Ready', 'RESTAURANT_REJECTED'

        const order = await orderModel.findOne({ _id: orderId, foodPartner: req.foodPartner._id });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (status === 'REJECTED' || status === 'RESTAURANT_REJECTED') {
            // Trigger State Machine Transition & Refund Flow
            await OrderStateMachineService.transition(order._id, 'RESTAURANT_REJECTED', { reason: 'Order rejected by restaurant' });
            await RefundService.processRefund({ orderId: order._id, reason: 'Order rejected by restaurant', requestedBy: 'RESTAURANT' });
            const finalOrder = await orderModel.findById(order._id);
            return res.status(200).json({ message: "Order rejected and refund initiated", order: finalOrder });
        }

        // Apply State Transition
        const updatedOrder = await OrderStateMachineService.transition(order._id, status);

        // If order is ready, automatically assign nearest delivery rider if not already assigned
        if ((status === 'Ready' || status === 'READY_FOR_PICKUP') && !updatedOrder.deliveryPartner) {
            await assignNearestDeliveryPartner(updatedOrder);
        }

        res.status(200).json({ message: `Order status updated to ${status}`, order: updatedOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Submit Rating & Review
async function submitOrderRating(req, res) {
    try {
        const { orderId } = req.params;
        const { foodRating = 5, deliveryRating = 5, restaurantRating = 5, comment = '' } = req.body;

        const order = await orderModel.findOne({ _id: orderId, customer: req.user._id });
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.ratings = { food: foodRating, delivery: deliveryRating, restaurant: restaurantRating, comment };
        await order.save();

        await reviewModel.create({
            order: order._id,
            user: req.user._id,
            foodPartner: order.foodPartner,
            deliveryPartner: order.deliveryPartner,
            rating: Math.round((foodRating + deliveryRating + restaurantRating) / 3),
            comment
        });

        res.status(200).json({ message: "Rating submitted successfully", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getRestaurantOrders,
    updateRestaurantOrderStatus,
    submitOrderRating
};

