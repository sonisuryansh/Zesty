const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authUserMiddleware, authFoodPartnerMiddleware } = require('../middlewares/auth.middleware');

// User Order Endpoints
router.post('/checkout', authUserMiddleware, orderController.createOrder);
router.get('/my-orders', authUserMiddleware, orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderById);
router.put('/:orderId/cancel', authUserMiddleware, orderController.cancelOrder);
router.post('/:orderId/rate', authUserMiddleware, orderController.submitOrderRating);

// Restaurant Order Endpoints
router.get('/restaurant/incoming', authFoodPartnerMiddleware, orderController.getRestaurantOrders);
router.put('/restaurant/:orderId/status', authFoodPartnerMiddleware, orderController.updateRestaurantOrderStatus);

module.exports = router;
