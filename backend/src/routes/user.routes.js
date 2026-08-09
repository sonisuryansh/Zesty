const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authUserMiddleware } = require('../middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

// Soft auth middleware to extract viewer user if logged in without blocking unauthenticated requests
async function softAuthMiddleware(req, res, next) {
    try {
        const { extractToken } = require('../middlewares/auth.middleware');
        const token = extractToken(req);
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zesty_secret_key_2026');
            if (decoded.role === 'user' || !decoded.role) {
                const user = await userModel.findById(decoded.id || decoded._id);
                if (user) req.user = user;
            }
        }
    } catch {}
    next();
}

// Public / Soft Auth endpoints
router.get('/profile/:userId', softAuthMiddleware, userController.getUserProfile);
router.get('/:userId/posts', userController.getUserPostsAndReels);
router.get('/:userId/reels', userController.getUserPostsAndReels);

// Protected endpoints for authenticated users
router.put('/profile', authUserMiddleware, userController.updateUserProfile);
router.post('/:userId/follow', authUserMiddleware, userController.followUser);
router.delete('/:userId/follow', authUserMiddleware, userController.unfollowUser);

module.exports = router;
