const userModel = require('../models/user.model');
const foodPartnerModel = require('../models/foodpartner.model');
const deliveryPartnerModel = require('../models/deliverypartner.model');
const orderModel = require('../models/order.model');
const settingsModel = require('../models/settings.model');
const foodModel = require('../models/food.model');

// Dashboard Stats & KPI Cards
async function getDashboardStats(req, res) {
    try {
        const totalUsers = await userModel.countDocuments();
        const totalRestaurants = await foodPartnerModel.countDocuments();
        const totalDeliveryPartners = await deliveryPartnerModel.countDocuments();
        const totalOrders = await orderModel.countDocuments();

        const pendingOrders = await orderModel.countDocuments({ status: { $in: ['Placed', 'Accepted', 'Preparing', 'Ready', 'Assigned Rider', 'Picked Up', 'Out for Delivery'] } });
        const completedOrders = await orderModel.countDocuments({ status: 'Delivered' });
        const cancelledOrders = await orderModel.countDocuments({ status: 'Cancelled' });

        const revenueResult = await orderModel.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$pricing.grandTotal' } } }
        ]);

        const totalRevenue = revenueResult[0] ? revenueResult[0].totalRevenue : 0;

        // Analytics chart data
        const recentOrders = await orderModel.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('customer', 'fullName email')
            .populate('foodPartner', 'name');

        res.status(200).json({
            stats: {
                totalUsers,
                totalRestaurants,
                totalDeliveryPartners,
                totalOrders,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue
            },
            recentOrders
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to load dashboard stats", error: err.message });
    }
}

// User Management
async function getAllUsers(req, res) {
    try {
        const users = await userModel.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateUserStatus(req, res) {
    try {
        const { userId } = req.params;
        const { isBlocked } = req.body;
        const user = await userModel.findByIdAndUpdate(userId, { isBlocked }, { new: true });
        res.status(200).json({ message: "User status updated", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function deleteUser(req, res) {
    try {
        const { userId } = req.params;
        await userModel.findByIdAndDelete(userId);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Restaurant Management
async function getAllRestaurants(req, res) {
    try {
        const restaurants = await foodPartnerModel.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ restaurants });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateRestaurantApproval(req, res) {
    try {
        const { partnerId } = req.params;
        const { status } = req.body; // approved, rejected, suspended
        const restaurant = await foodPartnerModel.findByIdAndUpdate(partnerId, { approvalStatus: status }, { new: true });
        res.status(200).json({ message: `Restaurant ${status}`, restaurant });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Delivery Partner Management
async function getAllDeliveryPartners(req, res) {
    try {
        const riders = await deliveryPartnerModel.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ riders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateRiderApproval(req, res) {
    try {
        const { riderId } = req.params;
        const { status } = req.body; // approved, rejected, suspended
        const rider = await deliveryPartnerModel.findByIdAndUpdate(riderId, { approvalStatus: status }, { new: true });
        res.status(200).json({ message: `Delivery rider ${status}`, rider });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Order Management & Override
async function getAllOrdersAdmin(req, res) {
    try {
        const orders = await orderModel.find()
            .populate('customer', 'fullName email')
            .populate('foodPartner', 'name')
            .populate('deliveryPartner', 'name phone')
            .sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateOrderStatusAdmin(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await orderModel.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.status = status;
        order.timeline.push({ status, timestamp: new Date() });
        await order.save();

        res.status(200).json({ message: "Order status updated", order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Platform Settings (Banners, Fees, Taxes)
async function getPlatformSettings(req, res) {
    try {
        let settings = await settingsModel.findOne();
        if (!settings) {
            settings = await settingsModel.create({
                categories: ['Trending', 'Fast Food', 'Dessert', 'Healthy', 'Drinks', 'Spicy'],
                deliveryChargeBase: 40,
                taxPercentage: 5,
                platformCommissionPercentage: 10
            });
        }
        res.status(200).json({ settings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updatePlatformSettings(req, res) {
    try {
        let settings = await settingsModel.findOne();
        if (!settings) {
            settings = new settingsModel(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.status(200).json({ message: "Settings updated successfully", settings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getAllRestaurants,
    updateRestaurantApproval,
    getAllDeliveryPartners,
    updateRiderApproval,
    getAllOrdersAdmin,
    updateOrderStatusAdmin,
    getPlatformSettings,
    updatePlatformSettings
};
