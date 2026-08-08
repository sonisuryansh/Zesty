const express = require('express');
const authController = require("../controllers/auth.controller");
const { loginLimiter, otpLimiter, signupLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimiter.middleware');
const { registerValidation, loginValidation, otpSendValidation } = require('../validators/auth.validator');
const { authUserMiddleware } = require('../middlewares/auth.middleware');
const router = express.Router();

// Customer User Auth APIs
router.post('/user/register', signupLimiter, registerValidation, authController.registerUser);
router.post('/user/login', loginLimiter, loginValidation, authController.loginUser);
router.get('/user/logout', authController.logoutUser);

// FoodPartner Auth APIs
router.post('/foodpartner/register', signupLimiter, registerValidation, authController.registerFoodPartner);
router.post('/foodpartner/login', loginLimiter, loginValidation, authController.loginFoodPartner);
router.get('/foodpartner/logout', authController.logoutFoodPartner);

// Super Admin Auth APIs
router.post('/admin/login', loginLimiter, authController.loginAdmin);

// Delivery Partner Auth APIs
router.post('/delivery/register', signupLimiter, registerValidation, authController.registerDeliveryPartner);
router.post('/delivery/login', loginLimiter, loginValidation, authController.loginDeliveryPartner);

// Google OAuth (All Roles)
router.post('/google', loginLimiter, authController.loginGoogle);

// Phone OTP Authentication (MSG91)
router.post('/send-otp', otpLimiter, otpSendValidation, authController.sendOtp);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);
router.post('/login-phone', loginLimiter, authController.loginPhone);

// Forgot Password Flow (Email or Phone OTP)
router.post('/forgot-password/send', forgotPasswordLimiter, authController.forgotPasswordSend);
router.post('/forgot-password/verify', forgotPasswordLimiter, authController.forgotPasswordVerify);

// Refresh Token & Session Management
router.post('/refresh', authController.refreshToken);
router.get('/sessions', authController.getSessions);
router.post('/logout-others', authController.logoutOther);
router.post('/logout-all', authController.logoutAll);

// Unified Session Verification
router.get('/me', authController.getMe);

module.exports = router;
