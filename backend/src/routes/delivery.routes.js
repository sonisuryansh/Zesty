const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const financeController = require('../controllers/finance.controller');
const { authDeliveryMiddleware } = require('../middlewares/auth.middleware');

router.use(authDeliveryMiddleware);

router.put('/duty-status', deliveryController.toggleDutyStatus);
router.post('/location', deliveryController.updateLocation);
router.get('/orders', deliveryController.getAssignedOrders);
router.post('/orders/:orderId/accept', deliveryController.acceptOrder);
router.put('/orders/:orderId/status', deliveryController.updateOrderProgress);
router.get('/earnings', deliveryController.getEarningsAndHistory);
router.get('/financials', deliveryController.getDeliveryFinancials);

// New Financial Endpoints
router.get('/earnings/details', financeController.getDeliveryPartnerEarnings);
router.get('/earnings/summary', financeController.getDeliveryPartnerEarningsSummary);
router.get('/payouts', financeController.getDeliveryPartnerPayouts);

module.exports = router;

