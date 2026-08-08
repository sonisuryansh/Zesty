const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const { authFoodPartnerMiddleware } = require('../middlewares/auth.middleware');

// Public endpoints
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

// Protected endpoints for Food Partners
router.put('/status', authFoodPartnerMiddleware, restaurantController.toggleOnlineStatus);
router.put('/packaging', authFoodPartnerMiddleware, restaurantController.updatePackagingCharge);
router.get('/dashboard/stats', authFoodPartnerMiddleware, restaurantController.getRestaurantDashboard);
router.get('/financials', authFoodPartnerMiddleware, restaurantController.getRestaurantFinancials);

module.exports = router;
