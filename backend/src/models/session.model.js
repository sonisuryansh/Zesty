const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userModelType'
    },
    userModelType: {
        type: String,
        required: true,
        enum: ['User', 'FoodPartner', 'Admin', 'DeliveryPartner']
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'foodpartner', 'admin', 'delivery']
    },
    refreshToken: {
        type: String,
        required: true,
        index: true
    },
    ip: String,
    browser: String,
    os: String,
    device: String,
    userAgent: String,
    lastActive: {
        type: Date,
        default: Date.now
    },
    isValid: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
