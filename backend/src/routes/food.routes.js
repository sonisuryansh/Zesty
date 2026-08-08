const express = require('express')
const router = express.Router();
const foodController = require("../controllers/food.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const multer = require('multer')

const upload = multer({
    storage: multer.memoryStorage(),
})

// POST => /api/food [protected: Food Partner]
router.post('/',
    authMiddleware.authFoodPartnerMiddleware,
    upload.single("video"),
    foodController.createFood
);

// GET /api/food [public for reel discovery]
router.get('/', foodController.getFoodItems);

// GET /api/food/restaurant/:restaurantId [restaurant-specific reels]
router.get('/restaurant/:restaurantId', foodController.getRestaurantReels);

// GET /api/food/restaurant/:restaurantId/search [restaurant-specific search]
router.get('/restaurant/:restaurantId/search', foodController.searchRestaurantFood);

// DELETE /api/food/:id [protected: Food Partner]
router.delete('/:id',
    authMiddleware.authFoodPartnerMiddleware,
    foodController.deleteFood
);

module.exports = router;