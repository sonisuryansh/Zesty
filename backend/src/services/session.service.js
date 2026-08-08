const jwt = require('jsonwebtoken');
const Session = require('../models/session.model');
const securityConfig = require('../config/security.config');
const { parseDeviceInfo } = require('../utils/device.utils');

function generateAccessToken(payload) {
    return jwt.sign(payload, securityConfig.JWT.ACCESS_SECRET, {
        expiresIn: securityConfig.JWT.ACCESS_EXPIRY
    });
}

function generateRefreshToken(payload) {
    return jwt.sign(payload, securityConfig.JWT.REFRESH_SECRET, {
        expiresIn: securityConfig.JWT.REFRESH_EXPIRY
    });
}

async function createSession(req, res, userDoc, modelType, role) {
    const payload = { id: userDoc._id, role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const deviceInfo = parseDeviceInfo(req);

    const session = await Session.create({
        userId: userDoc._id,
        userModelType: modelType,
        role,
        refreshToken,
        ip: deviceInfo.ip,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        userAgent: deviceInfo.userAgent,
        lastActive: new Date()
    });

    res.cookie(securityConfig.COOKIES.ACCESS_COOKIE_NAME, accessToken, securityConfig.COOKIES.OPTIONS);
    res.cookie(securityConfig.COOKIES.REFRESH_COOKIE_NAME, refreshToken, securityConfig.COOKIES.REFRESH_OPTIONS);

    return { accessToken, refreshToken, session };
}

async function clearAuthCookies(res) {
    res.clearCookie(securityConfig.COOKIES.ACCESS_COOKIE_NAME, securityConfig.COOKIES.OPTIONS);
    res.clearCookie(securityConfig.COOKIES.REFRESH_COOKIE_NAME, securityConfig.COOKIES.REFRESH_OPTIONS);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    createSession,
    clearAuthCookies
};
