const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const financeController = require('../controllers/finance.controller');
const { authFoodPartnerMiddleware } = require('../middlewares/auth.middleware');

// Public endpoints
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

// Protected endpoints for Food Partners
router.put('/status', authFoodPartnerMiddleware, restaurantController.toggleOnlineStatus);
router.put('/packaging', authFoodPartnerMiddleware, restaurantController.updatePackagingCharge);
router.get('/dashboard/stats', authFoodPartnerMiddleware, restaurantController.getRestaurantDashboard);
router.get('/financials', authFoodPartnerMiddleware, restaurantController.getRestaurantFinancials);

// New Financial Endpoints
router.get('/earnings', authFoodPartnerMiddleware, financeController.getRestaurantEarnings);
router.get('/settlements', authFoodPartnerMiddleware, financeController.getRestaurantSettlements);
router.get('/orders/:orderId/financials', authFoodPartnerMiddleware, financeController.getRestaurantOrderFinancials);

module.exports = router;

