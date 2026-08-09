const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

router.use(authUserMiddleware);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.post('/merge', cartController.mergeGuestCart);
router.put('/quantity', cartController.updateCartItemQuantity);
router.put('/update', cartController.updateCartItemQuantity);
router.delete('/remove', cartController.removeFromCart);
router.delete('/item/:foodId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;
