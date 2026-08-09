const FinancialLedger = require('../models/financialLedger.model');
const Order = require('../models/order.model');
const DeliveryEarning = require('../models/deliveryEarning.model');
const CommissionConfig = require('../models/commissionConfig.model');
const CommissionService = require('../services/CommissionService');

// ADMIN FINANCIAL DASHBOARD APIS

async function getAdminFinanceOverview(req, res) {
    try {
        const totalPaymentsResult = await FinancialLedger.aggregate([
            { $match: { type: 'CUSTOMER_PAYMENT', status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const totalCommissionResult = await FinancialLedger.aggregate([
            { $match: { type: 'PLATFORM_COMMISSION', status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const restaurantSettlementsResult = await FinancialLedger.aggregate([
            { $match: { type: 'RESTAURANT_SETTLEMENT' } },
            {
                $group: {
                    _id: '$status',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const deliveryEarningsResult = await DeliveryEarning.aggregate([
            {
                $group: {
                    _id: '$status',
                    total: { $sum: '$earningAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalRefundsResult = await FinancialLedger.aggregate([
            { $match: { type: 'REFUND', status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const failedPaymentsCount = await Order.countDocuments({ 'payment.status': { $in: ['FAILED', 'Failed'] } });

        const overview = {
            totalCustomerPaymentsPaise: totalPaymentsResult[0]?.total || 0,
            totalCustomerPaymentsRupees: Math.round((totalPaymentsResult[0]?.total || 0) / 100),
            totalPaymentsCount: totalPaymentsResult[0]?.count || 0,

            totalPlatformCommissionPaise: totalCommissionResult[0]?.total || 0,
            totalPlatformCommissionRupees: Math.round((totalCommissionResult[0]?.total || 0) / 100),

            restaurantSettlements: {
                completedPaise: restaurantSettlementsResult.find(r => r._id === 'COMPLETED')?.total || 0,
                completedRupees: Math.round((restaurantSettlementsResult.find(r => r._id === 'COMPLETED')?.total || 0) / 100),
                pendingPaise: restaurantSettlementsResult.find(r => r._id === 'PENDING')?.total || 0,
                pendingRupees: Math.round((restaurantSettlementsResult.find(r => r._id === 'PENDING')?.total || 0) / 100)
            },

            deliveryEarnings: {
                releasedPaise: deliveryEarningsResult.find(r => r._id === 'RELEASED')?.total || 0,
                releasedRupees: Math.round((deliveryEarningsResult.find(r => r._id === 'RELEASED')?.total || 0) / 100),
                reservedPaise: deliveryEarningsResult.find(r => r._id === 'RESERVED')?.total || 0,
                reservedRupees: Math.round((deliveryEarningsResult.find(r => r._id === 'RESERVED')?.total || 0) / 100)
            },

            totalRefundsPaise: totalRefundsResult[0]?.total || 0,
            totalRefundsRupees: Math.round((totalRefundsResult[0]?.total || 0) / 100),
            failedPaymentsCount
        };

        res.status(200).json({ overview });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getAdminTransactions(req, res) {
    try {
        const { type, status, startDate, endDate, page = 1, limit = 20 } = req.query;

        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await FinancialLedger.countDocuments(query);

        const transactions = await FinancialLedger.find(query)
            .populate('orderId', 'orderNumber status pricing')
            .populate('userId', 'fullName email')
            .populate('restaurantId', 'name email')
            .populate('deliveryPartnerId', 'name phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getAdminOrderFinancialDetails(req, res) {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('customer', 'fullName email phone')
            .populate('foodPartner', 'name email location')
            .populate('deliveryPartner', 'name phone');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const ledgerEntries = await FinancialLedger.find({ orderId: order._id }).sort({ createdAt: 1 });
        const deliveryEarning = await DeliveryEarning.findOne({ orderId: order._id });

        res.status(200).json({
            order,
            ledgerEntries,
            deliveryEarning
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getAdminSettlements(req, res) {
    try {
        const settlements = await FinancialLedger.find({ type: 'RESTAURANT_SETTLEMENT' })
            .populate('restaurantId', 'name email phone')
            .populate('orderId', 'orderNumber status createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({ settlements });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getAdminPayouts(req, res) {
    try {
        const payouts = await DeliveryEarning.find()
            .populate('deliveryPartnerId', 'name phone email')
            .populate('orderId', 'orderNumber status createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({ payouts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getCommissionConfig(req, res) {
    try {
        const config = await CommissionService.getActiveConfig();
        res.status(200).json({ config });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateCommissionConfig(req, res) {
    try {
        const { platformCommissionPercentage, deliveryPartnerPercentage, commissionBase = 'FOOD_SUBTOTAL' } = req.body;

        const config = await CommissionConfig.create({
            platformCommissionPercentage: Number(platformCommissionPercentage) || 5,
            deliveryPartnerPercentage: Number(deliveryPartnerPercentage) || 5,
            commissionBase,
            active: true,
            updatedBy: req.admin?._id
        });

        res.status(200).json({ message: "Commission configuration updated successfully", config });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// RESTAURANT FINANCIAL APIS

async function getRestaurantEarnings(req, res) {
    try {
        const restaurantId = req.foodPartner._id;

        const ledgerEntries = await FinancialLedger.find({
            restaurantId,
            type: 'RESTAURANT_SETTLEMENT'
        }).sort({ createdAt: -1 });

        const totalEarningsPaise = ledgerEntries.reduce((sum, item) => sum + (item.status === 'COMPLETED' ? item.amount : 0), 0);
        const pendingEarningsPaise = ledgerEntries.reduce((sum, item) => sum + (item.status === 'PENDING' ? item.amount : 0), 0);

        res.status(200).json({
            totalEarningsPaise,
            totalEarningsRupees: Math.round(totalEarningsPaise / 100),
            pendingEarningsPaise,
            pendingEarningsRupees: Math.round(pendingEarningsPaise / 100),
            ledgerEntries
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getRestaurantSettlements(req, res) {
    try {
        const restaurantId = req.foodPartner._id;
        const settlements = await FinancialLedger.find({
            restaurantId,
            type: 'RESTAURANT_SETTLEMENT'
        }).populate('orderId', 'orderNumber status createdAt pricing').sort({ createdAt: -1 });

        res.status(200).json({ settlements });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getRestaurantOrderFinancials(req, res) {
    try {
        const restaurantId = req.foodPartner._id;
        const { orderId } = req.params;

        const order = await Order.findOne({ _id: orderId, foodPartner: restaurantId })
            .select('orderNumber status pricing commission settlement financialBreakdown createdAt');

        if (!order) {
            return res.status(404).json({ message: "Order not found or unauthorized access" });
        }

        const ledgerEntries = await FinancialLedger.find({ orderId: order._id, restaurantId });

        res.status(200).json({ order, ledgerEntries });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// DELIVERY PARTNER FINANCIAL APIS

async function getDeliveryPartnerEarnings(req, res) {
    try {
        const deliveryPartnerId = req.deliveryPartner._id;

        const earnings = await DeliveryEarning.find({ deliveryPartnerId })
            .populate('orderId', 'orderNumber status createdAt pricing')
            .sort({ createdAt: -1 });

        const totalReleasedPaise = earnings.reduce((sum, e) => sum + (e.status === 'RELEASED' || e.status === 'PAID_OUT' ? e.earningAmount : 0), 0);
        const totalReservedPaise = earnings.reduce((sum, e) => sum + (e.status === 'RESERVED' || e.status === 'PENDING' ? e.earningAmount : 0), 0);

        res.status(200).json({
            totalReleasedPaise,
            totalReleasedRupees: Math.round(totalReleasedPaise / 100),
            totalReservedPaise,
            totalReservedRupees: Math.round(totalReservedPaise / 100),
            earnings
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getDeliveryPartnerEarningsSummary(req, res) {
    try {
        const deliveryPartnerId = req.deliveryPartner._id;

        const summary = await DeliveryEarning.aggregate([
            { $match: { deliveryPartnerId, status: { $in: ['RELEASED', 'PAID_OUT'] } } },
            {
                $group: {
                    _id: null,
                    totalDeliveries: { $sum: 1 },
                    totalEarnedPaise: { $sum: '$earningAmount' }
                }
            }
        ]);

        res.status(200).json({
            totalDeliveries: summary[0]?.totalDeliveries || 0,
            totalEarnedPaise: summary[0]?.totalEarnedPaise || 0,
            totalEarnedRupees: Math.round((summary[0]?.totalEarnedPaise || 0) / 100)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getDeliveryPartnerPayouts(req, res) {
    try {
        const deliveryPartnerId = req.deliveryPartner._id;
        const payouts = await DeliveryEarning.find({ deliveryPartnerId, status: { $in: ['RELEASED', 'PAID_OUT'] } })
            .populate('orderId', 'orderNumber createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({ payouts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    // Admin
    getAdminFinanceOverview,
    getAdminTransactions,
    getAdminOrderFinancialDetails,
    getAdminSettlements,
    getAdminPayouts,
    getCommissionConfig,
    updateCommissionConfig,

    // Restaurant
    getRestaurantEarnings,
    getRestaurantSettlements,
    getRestaurantOrderFinancials,

    // Delivery Partner
    getDeliveryPartnerEarnings,
    getDeliveryPartnerEarningsSummary,
    getDeliveryPartnerPayouts
};
