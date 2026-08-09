const foodPartnerModel = require('../models/foodpartner.model');
const foodModel = require('../models/food.model');
const orderModel = require('../models/order.model');

// List all restaurants
async function getAllRestaurants(req, res) {
    try {
        const restaurants = await foodPartnerModel.find({ approvalStatus: 'approved' })
            .select('-password -failedLoginAttempts -knownDevices')
            .sort({ isOnline: -1, createdAt: -1 });

        res.status(200).json({
            message: "Restaurants fetched successfully",
            restaurants
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Get specific restaurant profile with menu & reels
async function getRestaurantById(req, res) {
    try {
        const { id } = req.params;
        const restaurant = await foodPartnerModel.findById(id).select('-password -failedLoginAttempts -knownDevices');
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const foodItems = await foodModel.find({ foodPartner: id }).sort({ createdAt: -1 });

        res.status(200).json({
            restaurant,
            foodItems
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Toggle Online/Offline Status for authenticated Food Partner
async function toggleOnlineStatus(req, res) {
    try {
        const { isOnline } = req.body;
        const partner = await foodPartnerModel.findByIdAndUpdate(
            req.foodPartner._id,
            { isOnline: Boolean(isOnline) },
            { returnDocument: 'after' }
        ).select('-password');

        res.status(200).json({
            message: `Restaurant is now ${partner.isOnline ? 'Online 🟢' : 'Offline 🔴'}`,
            partner
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Get Restaurant Dashboard Statistics
async function getRestaurantDashboard(req, res) {
    try {
        const partnerId = req.foodPartner._id;
        const totalOrders = await orderModel.countDocuments({ foodPartner: partnerId });
        const pendingOrders = await orderModel.countDocuments({
            foodPartner: partnerId,
            status: { $in: ['Placed', 'Accepted', 'Preparing', 'Ready'] }
        });
        const completedOrders = await orderModel.countDocuments({ foodPartner: partnerId, status: 'Delivered' });

        const revenueResult = await orderModel.aggregate([
            { $match: { foodPartner: partnerId, status: 'Delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$pricing.grandTotal' } } }
        ]);

        const totalRevenue = revenueResult[0] ? revenueResult[0].totalRevenue : 0;
        const totalReels = await foodModel.countDocuments({ foodPartner: partnerId });

        res.status(200).json({
            stats: {
                totalOrders,
                pendingOrders,
                completedOrders,
                totalRevenue,
                totalReels,
                isOnline: req.foodPartner.isOnline
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Update Restaurant Packaging Charge
async function updatePackagingCharge(req, res) {
    try {
        const { packagingCharge = 20 } = req.body;
        const partner = await foodPartnerModel.findByIdAndUpdate(
            req.foodPartner._id,
            { packagingCharge: Number(packagingCharge) },
            { returnDocument: 'after' }
        ).select('-password');

        res.status(200).json({ message: "Packaging charge updated successfully", partner });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Get Restaurant Financial Analytics & Monthly Earnings Ledger
async function getRestaurantFinancials(req, res) {
    try {
        const partnerId = req.foodPartner._id;
        const { month } = req.query; // YYYY-MM or default current month

        let startDate, endDate;
        if (month && /^\d{4}-\d{2}$/.test(month)) {
            const [year, m] = month.split('-').map(Number);
            startDate = new Date(year, m - 1, 1);
            endDate = new Date(year, m, 0, 23, 59, 59, 999);
        } else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const matchCriteria = {
            foodPartner: partnerId,
            status: 'Delivered',
            createdAt: { $gte: startDate, $lte: endDate }
        };

        // Monthly Summary Aggregation
        const summaryResult = await orderModel.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: null,
                    totalCompletedOrders: { $sum: 1 },
                    grossFoodSales: { $sum: { $ifNull: ['$financialBreakdown.foodSubtotal', { $ifNull: ['$pricing.subtotal', 0] }] } },
                    packagingIncome: { $sum: { $ifNull: ['$financialBreakdown.packagingCharge', 20] } },
                    platformCommission: { $sum: { $ifNull: ['$financialBreakdown.platformCommission', { $multiply: [{ $ifNull: ['$pricing.subtotal', 0] }, 0.05] }] } },
                    netRestaurantIncome: { $sum: { $ifNull: ['$financialBreakdown.restaurantEarnings', { $ifNull: ['$pricing.grandTotal', 0] }] } }
                }
            }
        ]);

        const summary = summaryResult[0] || {
            totalCompletedOrders: 0,
            grossFoodSales: 0,
            packagingIncome: 0,
            platformCommission: 0,
            netRestaurantIncome: 0
        };

        // Daily Breakdown for selected month
        const dailyBreakdown = await orderModel.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    ordersCount: { $sum: 1 },
                    grossFoodSales: { $sum: { $ifNull: ['$financialBreakdown.foodSubtotal', { $ifNull: ['$pricing.subtotal', 0] }] } },
                    platformCommission: { $sum: { $ifNull: ['$financialBreakdown.platformCommission', { $multiply: [{ $ifNull: ['$pricing.subtotal', 0] }, 0.05] }] } },
                    netIncome: { $sum: { $ifNull: ['$financialBreakdown.restaurantEarnings', { $ifNull: ['$pricing.grandTotal', 0] }] } }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        res.status(200).json({
            month: month || new Date().toISOString().slice(0, 7),
            summary,
            dailyBreakdown
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getAllRestaurants,
    getRestaurantById,
    toggleOnlineStatus,
    getRestaurantDashboard,
    updatePackagingCharge,
    getRestaurantFinancials
};
