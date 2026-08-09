const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

// Public Webhook listener
router.post('/webhook', paymentController.handlePaymentWebhook);

// Protected Customer Payment Endpoints
router.post('/create-order', authUserMiddleware, paymentController.createPaymentOrder);
router.post('/verify', authUserMiddleware, paymentController.verifyPayment);
router.post('/refund', authUserMiddleware, paymentController.initiateRefund);

module.exports = router;
