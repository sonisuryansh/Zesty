const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    googleId: {
        type: String,
        sparse: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'manager'],
        default: 'superadmin'
    },
    permissions: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    knownDevices: [{
        ip: String,
        userAgent: String,
        lastUsed: Date
    }]
}, {
    timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
