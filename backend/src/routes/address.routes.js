const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');

router.use(authUserMiddleware);

router.get('/', addressController.getAddresses);
router.post('/', addressController.addAddress);
router.put('/:addressId', addressController.updateAddress);
router.delete('/:addressId', addressController.deleteAddress);

module.exports = router;
