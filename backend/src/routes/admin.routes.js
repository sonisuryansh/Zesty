const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authAdminMiddleware } = require('../middlewares/auth.middleware');

// Protect all admin routes
router.use(authAdminMiddleware);

router.get('/dashboard-stats', adminController.getDashboardStats);

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

module.exports = router;
