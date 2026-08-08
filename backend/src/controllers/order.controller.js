const orderModel = require('../models/order.model');
const cartModel = require('../models/cart.model');
const couponModel = require('../models/coupon.model');
const reviewModel = require('../models/review.model');
const foodPartnerModel = require('../models/foodpartner.model');
const { assignNearestDeliveryPartner } = require('./delivery.controller');
const { calculateOrderPricing } = require('../services/pricing.service');

// Place Order / Checkout
async function createOrder(req, res) {
    try {
        const { deliveryAddress, paymentMethod = 'COD', deliveryOption = 'Normal Delivery', couponCode = '' } = req.body;

        const cart = await cartModel.findOne({ user: req.user._id }).populate('items.food');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const partnerId = cart.foodPartner || cart.items[0]?.food?.foodPartner;
        if (partnerId) {
            const partner = await foodPartnerModel.findById(partnerId);
            if (partner && partner.isOnline === false) {
                return res.status(400).json({ message: "Restaurant is currently closed. Orders cannot be accepted." });
            }
        }

        // Server-Side Centralized Pricing Calculation & Financial Ledger
        const { processedItems, pricing, financialBreakdown } = await calculateOrderPricing({
            items: cart.items,
            foodPartnerId: partnerId,
            deliveryOption,
            couponCode
        });

        const orderNumber = 'ZST-' + Math.floor(100000 + Math.random() * 900000);
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const order = await orderModel.create({
            orderNumber,
            customer: req.user._id,
            foodPartner: partnerId,
            items: processedItems,
            deliveryAddress,
            pricing,
            financialBreakdown,
            couponCode,
            deliveryOption,
            payment: {
                method: paymentMethod,
                status: paymentMethod === 'COD' ? 'Pending' : 'Completed',
                transactionId: paymentMethod === 'COD' ? '' : 'TXN-' + Date.now()
            },
            status: 'Placed',
            otp,
            timeline: [{ status: 'Placed', timestamp: new Date() }]
        });

        // Clear user cart
        cart.items = [];
        cart.foodPartner = null;
        cart.subtotal = 0;
        await cart.save();
        cart.subtotal = 0;
        await cart.save();

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

        if (['Preparing', 'Ready', 'Picked Up', 'Out for Delivery', 'Delivered'].includes(order.status)) {
            return res.status(400).json({ message: "Order cannot be cancelled after kitchen preparation has started" });
        }

        order.status = 'Cancelled';
        order.cancellationReason = req.body.reason || 'Cancelled by user';
        order.timeline.push({ status: 'Cancelled', timestamp: new Date() });
        await order.save();

        res.status(200).json({ message: "Order cancelled successfully", order });
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

// Restaurant Order Status Update (Accept, Prepare, Ready)
async function updateRestaurantOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // 'Accepted', 'Preparing', 'Ready'

        const order = await orderModel.findOne({ _id: orderId, foodPartner: req.foodPartner._id });
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.status = status;
        order.timeline.push({ status, timestamp: new Date() });
        await order.save();

        // If order is ready, automatically assign nearest delivery rider if not already assigned
        if ((status === 'Ready' || status === 'READY_FOR_PICKUP') && !order.deliveryPartner) {
            await assignNearestDeliveryPartner(order);
        }

        res.status(200).json({ message: `Order status updated to ${status}`, order });
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
