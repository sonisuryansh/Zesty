const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const financeController = require('../controllers/finance.controller');
const { authAdminMiddleware } = require('../middlewares/auth.middleware');

// Protect all admin routes
router.use(authAdminMiddleware);

router.get('/dashboard-stats', adminController.getDashboardStats);

// Financial Dashboard Routes
router.get('/finance/overview', financeController.getAdminFinanceOverview);
router.get('/finance/transactions', financeController.getAdminTransactions);
router.get('/finance/orders/:orderId', financeController.getAdminOrderFinancialDetails);
router.get('/finance/settlements', financeController.getAdminSettlements);
router.get('/finance/payouts', financeController.getAdminPayouts);
router.get('/finance/commission-config', financeController.getCommissionConfig);
router.put('/finance/commission-config', financeController.updateCommissionConfig);

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// Restaurant Management
router.get('/restaurants', adminController.getAllRestaurants);
router.put('/restaurants/:partnerId/status', adminController.updateRestaurantApproval);

// Delivery Partner Management
router.get('/riders', adminController.getAllDeliveryPartners);
router.put('/riders/:riderId/status', adminController.updateRiderApproval);

// Order Management
router.get('/orders', adminController.getAllOrdersAdmin);
router.put('/orders/:orderId/status', adminController.updateOrderStatusAdmin);

// Settings
router.get('/settings', adminController.getPlatformSettings);
router.put('/settings', adminController.updatePlatformSettings);

// Food Content Management
router.delete('/foods/purge-no-media', async (req, res) => {
    try {
        const foodModel = require('../models/food.model');
        const result = await foodModel.deleteMany({
            $and: [
                { $or: [{ video: '' }, { video: null }, { video: { $exists: false } }] },
                { $or: [{ image: '' }, { image: null }, { image: { $exists: false } }] }
            ]
        });
        return res.status(200).json({ message: `Purged ${result.deletedCount} food items with no media`, deletedCount: result.deletedCount });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Purge Fake / Test Restaurant Accounts & Items
router.delete('/restaurants/purge-fake', async (req, res) => {
    try {
        const foodPartnerModel = require('../models/foodpartner.model');
        const foodModel = require('../models/food.model');

        // Find fake partners (test emails or specific test names)
        const fakePartners = await foodPartnerModel.find({
            $or: [
                { email: { $regex: /(@zesty\.com|@zesty\.test|@test-zesty\.com)$/i } },
                { name: { $in: ["Auth Test Bakery", "Pizza Express", "Pizza Palace A", "Burger Haven B", "Multi Partner"] } }
            ]
        });

        const fakeIds = fakePartners.map(p => p._id);

        // Delete foods linked to fake partners
        const foodDeleteResult = await foodModel.deleteMany({ foodPartner: { $in: fakeIds } });

        // Delete fake partners
        const partnerDeleteResult = await foodPartnerModel.deleteMany({ _id: { $in: fakeIds } });

        return res.status(200).json({
            message: `Purged ${partnerDeleteResult.deletedCount} fake restaurant accounts and ${foodDeleteResult.deletedCount} associated foods/videos.`,
            deletedPartnersCount: partnerDeleteResult.deletedCount,
            deletedFoodsCount: foodDeleteResult.deletedCount
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;

