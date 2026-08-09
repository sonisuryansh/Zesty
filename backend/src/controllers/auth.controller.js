const userModel = require("../models/user.model");
const foodPartnerModel = require("../models/foodpartner.model");
const adminModel = require("../models/admin.model");
const deliveryPartnerModel = require("../models/deliverypartner.model");
const Session = require("../models/session.model");
const OTP = require("../models/otp.model");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { generate6DigitOTP, hashOTP, verifyOTP, sendSMSOTP } = require('../utils/otp.utils');
const { sendEmail } = require('../utils/email.utils');
const { logAuditEvent } = require('../services/audit.service');
const { createSession, clearAuthCookies } = require('../services/session.service');
const securityConfig = require('../config/security.config');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to check account lock
function isAccountLocked(account) {
    return account.lockUntil && account.lockUntil > Date.now();
}

// Helper to handle failed login attempt
async function handleFailedLogin(account, req) {
    account.failedLoginAttempts = (account.failedLoginAttempts || 0) + 1;
    if (account.failedLoginAttempts >= securityConfig.ACCOUNT_SECURITY.MAX_FAILED_LOGIN_ATTEMPTS) {
        account.lockUntil = new Date(Date.now() + securityConfig.ACCOUNT_SECURITY.LOCK_TIME_MS);
        await logAuditEvent(req, {
            action: 'ACCOUNT_LOCKED',
            performedBy: account._id,
            details: { reason: 'Exceeded maximum failed login attempts' }
        });
    }
    await account.save();
}

// Helper to reset failed login on success
async function resetFailedLogin(account) {
    if (account.failedLoginAttempts > 0 || account.lockUntil) {
        account.failedLoginAttempts = 0;
        account.lockUntil = undefined;
        await account.save();
    }
}

// ==========================================
// 1. CUSTOMER / USER AUTHENTICATION
// ==========================================

async function registerUser(req, res) {
    const { fullName, email, password, phone } = req.body;
    const isUserAlreadyExists = await userModel.findOne({ email });
    if (isUserAlreadyExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Min 12 salt rounds
    const user = await userModel.create({
        fullName,
        email,
        password: hashedPassword,
        phone,
        isEmailVerified: false
    });

    // Create session & tokens
    const { session } = await createSession(req, res, user, 'User', 'user');

    // Dispatch verification email
    const verificationOtp = generate6DigitOTP();
    const hashedEmailOtp = await hashOTP(verificationOtp);
    await OTP.create({
        identifier: email,
        type: 'EMAIL_VERIFICATION',
        otp: hashedEmailOtp
    });
    await sendEmail({
        to: email,
        subject: 'Verify your Zesty Account',
        text: `Welcome to Zesty! Your email verification code is: ${verificationOtp}`
    });

    await logAuditEvent(req, {
        action: 'LOGIN',
        performedBy: user._id,
        performerModel: 'User',
        role: 'user',
        details: { method: 'Email Signup' }
    });

    res.status(201).json({
        message: "User registered successfully. Verification email dispatched.",
        user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            isEmailVerified: user.isEmailVerified
        }
    });
}

async function loginUser(req, res) {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or Password" });
    }

    if (isAccountLocked(user)) {
        return res.status(423).json({ message: "Account locked due to 5 failed attempts. Please try again after 30 minutes." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        await handleFailedLogin(user, req);
        return res.status(400).json({ message: "Invalid email or Password" });
    }

    await resetFailedLogin(user);
    await createSession(req, res, user, 'User', 'user');

    await logAuditEvent(req, {
        action: 'LOGIN',
        performedBy: user._id,
        performerModel: 'User',
        role: 'user',
        details: { method: 'Email Login' }
    });

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            isEmailVerified: user.isEmailVerified
        }
    });
}

async function logoutUser(req, res) {
    const refreshToken = req.cookies[securityConfig.COOKIES.REFRESH_COOKIE_NAME];
    if (refreshToken) {
        await Session.updateOne({ refreshToken }, { isValid: false });
    }
    await clearAuthCookies(res);
    res.status(200).json({ message: "User logged out successfully" });
}

// ==========================================
// 2. FOOD PARTNER AUTHENTICATION
// ==========================================

async function registerFoodPartner(req, res) {
    const { name, email, password, phone, verificationDetails } = req.body;
    const isAccountAlreadyExists = await foodPartnerModel.findOne({ email });
    if (isAccountAlreadyExists) {
        return res.status(400).json({ message: "Food partner account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const foodPartner = await foodPartnerModel.create({
        name,
        email,
        password: hashedPassword,
        phone,
        verificationDetails: verificationDetails || {},
        approvalStatus: verificationDetails ? 'pending' : 'approved'
    });

    await createSession(req, res, foodPartner, 'FoodPartner', 'foodpartner');

    await logAuditEvent(req, {
        action: 'LOGIN',
        performedBy: foodPartner._id,
        performerModel: 'FoodPartner',
        role: 'foodpartner',
        details: { method: 'Partner Signup' }
    });

    res.status(201).json({
        message: "Food partner registered successfully",
        foodPartner: {
            _id: foodPartner._id,
            email: foodPartner.email,
            name: foodPartner.name,
            approvalStatus: foodPartner.approvalStatus
        }
    });
}

async function loginFoodPartner(req, res) {
    const { email, password } = req.body;
    const foodPartner = await foodPartnerModel.findOne({ email });

    if (!foodPartner) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    if (isAccountLocked(foodPartner)) {
        return res.status(423).json({ message: "Account locked due to 5 failed attempts. Please try again after 30 minutes." });
    }

    const isPasswordValid = await bcrypt.compare(password, foodPartner.password);
    if (!isPasswordValid) {
        await handleFailedLogin(foodPartner, req);
        return res.status(400).json({ message: "Invalid email or password" });
    }

    await resetFailedLogin(foodPartner);
    await createSession(req, res, foodPartner, 'FoodPartner', 'foodpartner');

    await logAuditEvent(req, {
        action: 'LOGIN',
        performedBy: foodPartner._id,
        performerModel: 'FoodPartner',
        role: 'foodpartner',
        details: { method: 'Partner Email Login' }
    });

    res.status(200).json({
        message: "Food partner logged in successfully",
        foodPartner: {
            _id: foodPartner._id,
            email: foodPartner.email,
            name: foodPartner.name,
            approvalStatus: foodPartner.approvalStatus
        }
    });
}

async function logoutFoodPartner(req, res) {
    const refreshToken = req.cookies[securityConfig.COOKIES.REFRESH_COOKIE_NAME];
    if (refreshToken) {
        await Session.updateOne({ refreshToken }, { isValid: false });
    }
    await clearAuthCookies(res);
    res.status(200).json({ message: "Food partner logged out successfully" });
}

// ==========================================
// 3. SUPER ADMIN AUTHENTICATION
// ==========================================

async function loginAdmin(req, res) {
    const { email, password, otp } = req.body;
    let admin = await adminModel.findOne({ email });

    // Seed default Super Admin if empty
    if (!admin && email === 'admin@zesty.com' && password === 'admin123') {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        admin = await adminModel.create({
            name: 'Super Admin',
            email: 'admin@zesty.com',
            password: hashedPassword,
            role: 'superadmin'
        });
    }

    if (!admin) {
        return res.status(400).json({ message: "Invalid Admin Credentials" });
    }

    if (isAccountLocked(admin)) {
        return res.status(423).json({ message: "Admin account locked due to failed attempts." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        await handleFailedLogin(admin, req);
        return res.status(400).json({ message: "Invalid Admin Credentials" });
    }

    // Step-up 2FA Verification for Admin
    if (process.env.ADMIN_REQUIRE_2FA === 'true' && !otp) {
        const adminOtp = generate6DigitOTP();
        const hashedAdminOtp = await hashOTP(adminOtp);
        await OTP.create({
            identifier: email,
            type: 'ADMIN_2FA',
            otp: hashedAdminOtp
        });
        await sendEmail({
            to: email,
            subject: 'Zesty Admin 2FA Code',
            text: `Your Admin 2FA Login code is: ${adminOtp}`
        });
        return res.status(202).json({ message: "2FA OTP sent to admin email. Please provide 'otp' parameter.", requireOtp: true });
    }

    if (otp) {
        const record = await OTP.findOne({ identifier: email, type: 'ADMIN_2FA' }).sort({ createdAt: -1 });
        if (!record || !(await verifyOTP(otp, record.otp))) {
            return res.status(400).json({ message: "Invalid 2FA OTP code" });
        }
    }

    await resetFailedLogin(admin);
    await createSession(req, res, admin, 'Admin', 'admin');

    await logAuditEvent(req, {
        action: 'LOGIN',
        performedBy: admin._id,
        performerModel: 'Admin',
        role: 'admin',
        details: { method: 'Admin Login' }
    });

    return res.status(200).json({
        message: "Super Admin logged in successfully",
        admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
}

// ==========================================
// 4. DELIVERY PARTNER AUTHENTICATION
// ==========================================

async function registerDeliveryPartner(req, res) {
    const { name, email, phone, password, licenseNumber, vehicleDetails, verificationDetails } = req.body;
    const existing = await deliveryPartnerModel.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
        return res.status(400).json({ message: "Rider email or phone already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const partner = await deliveryPartnerModel.create({
        name,
        email,
        phone,
        password: hashedPassword,
        licenseNumber: licenseNumber || '',
        vehicleDetails: vehicleDetails || '',
        verificationDetails: verificationDetails || {},
        approvalStatus: 'pending'
    });

    await createSession(req, res, partner, 'DeliveryPartner', 'delivery');

    await logAuditEvent(req, {
        action: 'LOGIN',
        performedBy: partner._id,
        performerModel: 'DeliveryPartner',
        role: 'delivery',
        details: { method: 'Delivery Partner Signup' }
    });

    res.status(201).json({
        message: "Delivery partner registered successfully. Pending admin approval.",
        deliveryPartner: { _id: partner._id, name: partner.name, email: partner.email, phone: partner.phone, approvalStatus: partner.approvalStatus }
    });
}

async function loginDeliveryPartner(req, res) {
    const { email, password } = req.body;
    const partner = await deliveryPartnerModel.findOne({ email });
    if (!partner) {
        return res.status(400).json({ message: "Invalid Rider Credentials" });
    }

    if (isAccountLocked(partner)) {
        return res.status(423).json({ message: "Account locked due to 5 failed attempts. Please try again after 30 minutes." });
    }

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
        await handleFailedLogin(partner, req);
        return res.status(400).json({ message: "Invalid Rider Credentials" });
    }

    await resetFailedLogin(partner);
    await createSession(req, res, partner, 'DeliveryPartner', 'delivery');

    await logAuditEvent(req, {
        action: 'LOGIN',
        performedBy: partner._id,
        performerModel: 'DeliveryPartner',
        role: 'delivery',
        details: { method: 'Delivery Partner Login' }
    });

    return res.status(200).json({
        message: "Delivery partner logged in successfully",
        deliveryPartner: {
            _id: partner._id,
            name: partner.name,
            email: partner.email,
            approvalStatus: partner.approvalStatus,
            dutyStatus: partner.dutyStatus
        }
    });
}

// ==========================================
// 5. GOOGLE OAUTH AUTHENTICATION (ALL ROLES)
// ==========================================

async function loginGoogle(req, res) {
    const rawRole = (req.body.role || 'user').toLowerCase();
    const idToken = req.body.idToken;

    try {
        if (!idToken) {
            return res.status(400).json({ message: "Google ID Token is required" });
        }

        // Normalize target role
        let targetRole = 'user';
        if (rawRole === 'foodpartner' || rawRole === 'partner') {
            targetRole = 'foodpartner';
        } else if (rawRole === 'delivery' || rawRole === 'rider' || rawRole === 'deliverypartner') {
            targetRole = 'delivery';
        } else if (rawRole === 'user' || rawRole === 'customer') {
            targetRole = 'user';
        } else if (rawRole === 'admin') {
            return res.status(403).json({ message: "Google OAuth authentication is not permitted for Super Admin accounts." });
        } else {
            return res.status(400).json({ message: `Invalid portal role: ${rawRole}` });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const email = payload.email ? payload.email.toLowerCase() : null;
        const name = payload.name;
        const picture = payload.picture;
        const googleId = payload.sub;

        if (!email) {
            return res.status(400).json({ message: "Verified email address not found in Google credentials." });
        }

        // Search across all models to check for role registration & cross-role mismatches
        const existingUser = await userModel.findOne({ $or: [{ email }, { googleId }] });
        const existingPartner = await foodPartnerModel.findOne({ $or: [{ email }, { googleId }] });
        const existingRider = await deliveryPartnerModel.findOne({ $or: [{ email }, { googleId }] });

        // Enforce role isolation & clear mismatch errors
        if (targetRole === 'delivery') {
            if (existingUser && !existingRider) {
                return res.status(409).json({ message: "This Google account is registered as a Customer. Switch to the Customer Login tab." });
            }
            if (existingPartner && !existingRider) {
                return res.status(409).json({ message: "This Google account is registered as a Restaurant Partner. Switch to the Restaurant Partner tab." });
            }
        } else if (targetRole === 'foodpartner') {
            if (existingUser && !existingPartner) {
                return res.status(409).json({ message: "This Google account is registered as a Customer. Switch to the Customer Login tab." });
            }
            if (existingRider && !existingPartner) {
                return res.status(409).json({ message: "This Google account is registered as a Delivery Rider. Switch to the Delivery Rider tab." });
            }
        } else if (targetRole === 'user') {
            if (existingRider && !existingUser) {
                return res.status(409).json({ message: "This Google account is registered as a Delivery Rider. Switch to the Delivery Rider tab." });
            }
            if (existingPartner && !existingUser) {
                return res.status(409).json({ message: "This Google account is registered as a Restaurant Partner. Switch to the Restaurant Partner tab." });
            }
        }

        let account, modelType;

        if (targetRole === 'delivery') {
            modelType = 'DeliveryPartner';
            if (existingRider) {
                account = existingRider;
                if (!account.googleId) account.googleId = googleId;
                account.isEmailVerified = true;
                if (picture && !account.profilePicture) account.profilePicture = picture;
                await account.save();
                console.log(`[GoogleOAuth DB Write] Updated DeliveryPartner account ID: ${account._id}`);
            } else {
                console.log(`[GoogleOAuth DB Write] Creating new DeliveryPartner for email: ${email}`);
                account = await deliveryPartnerModel.create({
                    name: name || email.split('@')[0],
                    email: email,
                    googleId: googleId,
                    profilePicture: picture || '',
                    isEmailVerified: true,
                    approvalStatus: 'approved',
                    dutyStatus: 'offline'
                });
                console.log(`[GoogleOAuth DB Write] Created new DeliveryPartner account ID: ${account._id}`);
            }
        } else if (targetRole === 'foodpartner') {
            modelType = 'FoodPartner';
            if (existingPartner) {
                account = existingPartner;
                if (!account.googleId) account.googleId = googleId;
                account.isEmailVerified = true;
                if (picture && !account.avatar) account.avatar = picture;
                await account.save();
                console.log(`[GoogleOAuth DB Write] Updated FoodPartner account ID: ${account._id}`);
            } else {
                console.log(`[GoogleOAuth DB Write] Creating new FoodPartner for email: ${email}`);
                account = await foodPartnerModel.create({
                    name: name || email.split('@')[0],
                    email: email,
                    googleId: googleId,
                    avatar: picture || '',
                    isEmailVerified: true,
                    approvalStatus: 'approved',
                    isOnline: true
                });
                console.log(`[GoogleOAuth DB Write] Created new FoodPartner account ID: ${account._id}`);
            }
        } else {
            modelType = 'User';
            if (existingUser) {
                account = existingUser;
                if (!account.googleId) account.googleId = googleId;
                account.isEmailVerified = true;
                if (picture && !account.profilePicture && !account.avatar) {
                    account.profilePicture = picture;
                    account.avatar = picture;
                }
                await account.save();
                console.log(`[GoogleOAuth DB Write] Updated User account ID: ${account._id}`);
            } else {
                console.log(`[GoogleOAuth DB Write] Creating new User for email: ${email}`);
                account = await userModel.create({
                    fullName: name || email.split('@')[0],
                    name: name || email.split('@')[0],
                    email: email,
                    googleId: googleId,
                    profilePicture: picture || '',
                    avatar: picture || '',
                    isEmailVerified: true
                });
                console.log(`[GoogleOAuth DB Write] Created new User account ID: ${account._id}`);
            }
        }

        if (!account || !account._id) {
            throw new Error(`Failed to create or update ${modelType} in database ${mongoose.connection.name}`);
        }

        await createSession(req, res, account, modelType, targetRole);

        await logAuditEvent(req, {
            action: 'LOGIN',
            performedBy: account._id,
            performerModel: modelType,
            role: targetRole,
            details: { method: 'Google OAuth' }
        });

        return res.status(200).json({
            message: "Google OAuth authentication successful",
            user: {
                id: account._id,
                email: account.email,
                name: account.fullName || account.name,
                type: targetRole,
                profile: account
            },
            profile: account
        });
    } catch (err) {
        console.error('Google OAuth Error:', err.stack || err.message);
        return res.status(400).json({ message: err.message || "Google OAuth verification failed" });
    }
}

// ==========================================
// 6. MSG91 PHONE OTP AUTHENTICATION & FORGOT PASSWORD
// ==========================================

async function sendOtp(req, res) {
    const { phone, type = 'PHONE_LOGIN' } = req.body;

    const existingOtp = await OTP.findOne({ identifier: phone, type });
    if (existingOtp && existingOtp.resendAvailableAt > Date.now()) {
        const secondsRemaining = Math.ceil((existingOtp.resendAvailableAt - Date.now()) / 1000);
        return res.status(429).json({ message: `Please wait ${secondsRemaining} seconds before requesting a new OTP.` });
    }

    const otpCode = generate6DigitOTP();
    const hashedOtp = await hashOTP(otpCode);

    await OTP.deleteMany({ identifier: phone, type });
    await OTP.create({
        identifier: phone,
        type,
        otp: hashedOtp,
        resendAvailableAt: new Date(Date.now() + 60 * 1000), // 60s cooldown
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 mins
    });

    await sendSMSOTP(phone, otpCode);

    return res.status(200).json({ message: "OTP sent successfully to phone", cooldownSeconds: 60 });
}

async function verifyOtp(req, res) {
    const { phone, otp, type = 'PHONE_LOGIN' } = req.body;
    const record = await OTP.findOne({ identifier: phone, type });

    if (!record) {
        return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }

    if (record.attempts >= securityConfig.ACCOUNT_SECURITY.MAX_OTP_ATTEMPTS) {
        await OTP.deleteOne({ _id: record._id });
        return res.status(429).json({ message: "Maximum OTP verification attempts exceeded. Request a new OTP." });
    }

    record.attempts += 1;
    await record.save();

    const isValid = await verifyOTP(otp, record.otp);
    if (!isValid) {
        return res.status(400).json({ message: "Invalid OTP code" });
    }

    await OTP.deleteOne({ _id: record._id });
    return res.status(200).json({ message: "OTP verified successfully" });
}

async function loginPhone(req, res) {
    const { phone, otp, role = 'user' } = req.body;
    const record = await OTP.findOne({ identifier: phone, type: 'PHONE_LOGIN' });

    if (!record || !(await verifyOTP(otp, record.otp))) {
        return res.status(400).json({ message: "Invalid or expired Phone OTP" });
    }

    await OTP.deleteOne({ _id: record._id });

    let model, modelType;
    if (role === 'foodpartner') {
        model = foodPartnerModel;
        modelType = 'FoodPartner';
    } else if (role === 'delivery') {
        model = deliveryPartnerModel;
        modelType = 'DeliveryPartner';
    } else {
        model = userModel;
        modelType = 'User';
    }

    let account = await model.findOne({ phone });
    if (!account) {
        account = await model.create({
            fullName: `User_${phone.slice(-4)}`,
            name: `Partner_${phone.slice(-4)}`,
            email: `${phone}@zesty.phone`,
            phone
        });
    }

    await createSession(req, res, account, modelType, role);

    return res.status(200).json({ message: "Phone OTP login successful", profile: account });
}

async function forgotPasswordSend(req, res) {
    const { identifier } = req.body; // Email or Phone
    const otpCode = generate6DigitOTP();
    const hashedOtp = await hashOTP(otpCode);

    await OTP.deleteMany({ identifier, type: 'FORGOT_PASSWORD' });
    await OTP.create({
        identifier,
        type: 'FORGOT_PASSWORD',
        otp: hashedOtp
    });

    if (identifier.includes('@')) {
        await sendEmail({
            to: identifier,
            subject: 'Zesty Password Reset Code',
            text: `Your password reset code is: ${otpCode}. Valid for 5 minutes.`
        });
    } else {
        await sendSMSOTP(identifier, otpCode);
    }

    res.status(200).json({ message: "Password reset OTP sent to target email/phone" });
}

async function forgotPasswordVerify(req, res) {
    const { identifier, otp, newPassword } = req.body;
    const record = await OTP.findOne({ identifier, type: 'FORGOT_PASSWORD' });

    if (!record || !(await verifyOTP(otp, record.otp))) {
        return res.status(400).json({ message: "Invalid or expired reset OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    let updated = await userModel.findOneAndUpdate({ $or: [{ email: identifier }, { phone: identifier }] }, { password: hashedPassword });
    if (!updated) updated = await foodPartnerModel.findOneAndUpdate({ $or: [{ email: identifier }, { phone: identifier }] }, { password: hashedPassword });
    if (!updated) updated = await deliveryPartnerModel.findOneAndUpdate({ $or: [{ email: identifier }, { phone: identifier }] }, { password: hashedPassword });

    await OTP.deleteOne({ _id: record._id });

    if (updated) {
        await logAuditEvent(req, {
            action: 'PASSWORD_CHANGE',
            performedBy: updated._id,
            details: { identifier }
        });
    }

    res.status(200).json({ message: "Password updated successfully. You can now login with your new password." });
}

// ==========================================
// 7. REFRESH TOKEN & SESSION MANAGEMENT
// ==========================================

async function refreshToken(req, res) {
    const refreshTokenCookie = req.cookies[securityConfig.COOKIES.REFRESH_COOKIE_NAME];
    if (!refreshTokenCookie) {
        return res.status(401).json({ message: "Refresh token missing" });
    }

    try {
        const decoded = jwt.verify(refreshTokenCookie, securityConfig.JWT.REFRESH_SECRET);
        const session = await Session.findOne({ refreshToken: refreshTokenCookie, isValid: true });
        if (!session) {
            return res.status(401).json({ message: "Session revoked or expired" });
        }

        const newAccessToken = jwt.sign({ id: decoded.id, role: decoded.role }, securityConfig.JWT.ACCESS_SECRET, { expiresIn: securityConfig.JWT.ACCESS_EXPIRY });
        res.cookie(securityConfig.COOKIES.ACCESS_COOKIE_NAME, newAccessToken, securityConfig.COOKIES.OPTIONS);

        return res.status(200).json({ message: "Token refreshed successfully", accessToken: newAccessToken });
    } catch (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
}

async function getSessions(req, res) {
    const userId = req.user?._id || req.foodPartner?._id || req.admin?._id || req.deliveryPartner?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const sessions = await Session.find({ userId, isValid: true }).select("-refreshToken").sort({ lastActive: -1 });
    res.status(200).json({ sessions });
}

async function logoutOther(req, res) {
    const userId = req.user?._id || req.foodPartner?._id || req.admin?._id || req.deliveryPartner?._id;
    const currentRefreshToken = req.cookies[securityConfig.COOKIES.REFRESH_COOKIE_NAME];

    await Session.updateMany({ userId, refreshToken: { $ne: currentRefreshToken } }, { isValid: false });
    res.status(200).json({ message: "Logged out from all other devices successfully" });
}

async function logoutAll(req, res) {
    const userId = req.user?._id || req.foodPartner?._id || req.admin?._id || req.deliveryPartner?._id;
    await Session.updateMany({ userId }, { isValid: false });
    await clearAuthCookies(res);
    res.status(200).json({ message: "Logged out from all devices" });
}

// ==========================================
// 8. UNIFIED SESSION VERIFICATION (/me)
// ==========================================

async function getMe(req, res) {
    const token = req.cookies[securityConfig.COOKIES.ACCESS_COOKIE_NAME] || req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Not logged in" });
    }
    try {
        let decoded;
        try {
            decoded = jwt.verify(token, securityConfig.JWT.ACCESS_SECRET);
        } catch (e) {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'zesty_super_secret_jwt_key_2026');
        }

        // User check
        let user = await userModel.findById(decoded.id).select("-password");
        if (user) return res.status(200).json({ type: "user", profile: user });

        // Food Partner check
        let foodPartner = await foodPartnerModel.findById(decoded.id).select("-password");
        if (foodPartner) return res.status(200).json({ type: "foodpartner", profile: foodPartner });

        // Admin check
        let admin = await adminModel.findById(decoded.id).select("-password");
        if (admin) return res.status(200).json({ type: "admin", profile: admin });

        // Delivery Partner check
        let delivery = await deliveryPartnerModel.findById(decoded.id).select("-password");
        if (delivery) return res.status(200).json({ type: "delivery", profile: delivery });

        return res.status(401).json({ message: "Invalid session" });
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,

    registerFoodPartner,
    loginFoodPartner,
    logoutFoodPartner,

    loginAdmin,
    registerDeliveryPartner,
    loginDeliveryPartner,

    loginGoogle,
    sendOtp,
    verifyOtp,
    loginPhone,
    forgotPasswordSend,
    forgotPasswordVerify,

    refreshToken,
    getSessions,
    logoutOther,
    logoutAll,

    getMe
};
