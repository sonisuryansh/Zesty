const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        index: true // Phone number or Email
    },
    type: {
        type: String,
        required: true,
        enum: ['PHONE_LOGIN', 'EMAIL_VERIFICATION', 'FORGOT_PASSWORD', 'SUSPICIOUS_LOGIN', 'ADMIN_2FA']
    },
    otp: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    resendAvailableAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 * 1000) // 60s cooldown
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
