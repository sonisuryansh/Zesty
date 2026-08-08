const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'LOGOUT',
            'LOGOUT_ALL',
            'UPLOAD_REEL',
            'DELETE_REEL',
            'DELETE_USER',
            'COUPON_CHANGE',
            'PASSWORD_CHANGE',
            'ADMIN_ACTION',
            'PARTNER_VERIFICATION',
            'DELIVERY_VERIFICATION',
            'ACCOUNT_LOCKED',
            'SUSPICIOUS_LOGIN_ATTEMPT'
        ]
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'performerModel'
    },
    performerModel: {
        type: String,
        enum: ['User', 'FoodPartner', 'Admin', 'DeliveryPartner']
    },
    role: String,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
    browser: String,
    os: String,
    device: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
