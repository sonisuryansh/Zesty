const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 5,
    message: { message: "Too many login attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 5,
    message: { message: "Too many OTP requests. Please try again after 10 minutes." },
    standardHeaders: true,
    legacyHeaders: false
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { message: "Too many account registrations from this IP. Try again in an hour." },
    standardHeaders: true,
    legacyHeaders: false
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { message: "Too many password reset requests. Please try again in an hour." },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    loginLimiter,
    otpLimiter,
    signupLimiter,
    forgotPasswordLimiter
};
