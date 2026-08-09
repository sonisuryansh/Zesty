const foodPartnerModel = require("../models/foodpartner.model");
const userModel = require("../models/user.model");
const adminModel = require("../models/admin.model");
const deliveryPartnerModel = require("../models/deliverypartner.model");
const jwt = require('jsonwebtoken');
const securityConfig = require('../config/security.config');

// Helper to extract authentication token prioritizing Authorization Header over shared Cookies
function extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const headerToken = req.headers.authorization.split(' ')[1];
        if (headerToken && headerToken !== 'null' && headerToken !== 'undefined') {
            return headerToken;
        }
    }
    return req.cookies?.[securityConfig.COOKIES.ACCESS_COOKIE_NAME] || req.cookies?.token || null;
}

// Helper to verify token (accepts both access token & legacy JWT_SECRET)
function verifyToken(token) {
    try {
        return jwt.verify(token, securityConfig.JWT.ACCESS_SECRET);
    } catch (err) {
        return jwt.verify(token, process.env.JWT_SECRET || 'zesty_super_secret_jwt_key_2026');
    }
}

// Food Partner Authentication Middleware
async function authFoodPartnerMiddleware(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }
    try {
        const decoded = verifyToken(token);
        const foodPartner = await foodPartnerModel.findById(decoded.id);
        if (!foodPartner) {
            return res.status(401).json({ message: "Invalid session" });
        }
        if (foodPartner.lockUntil && foodPartner.lockUntil > Date.now()) {
            return res.status(423).json({ message: "Account is temporarily locked due to multiple failed attempts. Try again later." });
        }
        req.foodPartner = foodPartner;
        req.userRole = 'foodpartner';
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// User / Customer Authentication Middleware
async function authUserMiddleware(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }
    try {
        const decoded = verifyToken(token);
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "Invalid session" });
        }
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(423).json({ message: "Account is temporarily locked due to multiple failed attempts. Try again later." });
        }
        req.user = user;
        req.userRole = 'user';
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// Super Admin Authentication Middleware
async function authAdminMiddleware(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ message: "Admin authentication required" });
    }
    try {
        const decoded = verifyToken(token);
        const admin = await adminModel.findById(decoded.id);
        if (!admin) {
            return res.status(403).json({ message: "Access denied. Admin role required." });
        }
        req.admin = admin;
        req.userRole = 'admin';
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// Delivery Partner Authentication Middleware
async function authDeliveryMiddleware(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ message: "Delivery partner authentication required" });
    }
    try {
        const decoded = verifyToken(token);
        const deliveryPartner = await deliveryPartnerModel.findById(decoded.id);
        if (!deliveryPartner) {
            return res.status(403).json({ message: "Access denied. Delivery partner role required." });
        }
        req.deliveryPartner = deliveryPartner;
        req.userRole = 'delivery';
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// Role-Based Authorization Guard Middleware
function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ message: "Forbidden: Insufficient role permissions" });
        }
        next();
    };
}

module.exports = {
    extractToken,
    authFoodPartnerMiddleware,
    authUserMiddleware,
    authAdminMiddleware,
    authDeliveryMiddleware,
    requireRoles
};
