const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
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
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    googleId: {
        type: String,
        sparse: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    dutyStatus: {
        type: String,
        enum: ['offline', 'online', 'busy'],
        default: 'offline'
    },
    licenseNumber: {
        type: String,
        default: ''
    },
    vehicleDetails: {
        type: String,
        default: ''
    },
    // Delivery Verification Details
    verificationDetails: {
        drivingLicenseNumber: String,
        aadhaarNumber: String,
        vehicleNumber: String,
        vehicleType: String,
        selfieUrl: String
    },
    profilePicture: {
        type: String,
        default: ''
    },
    currentLocation: {
        latitude: { type: Number, default: 28.6139 },
        longitude: { type: Number, default: 77.2090 },
        addressText: { type: String, default: 'Connaught Place, New Delhi' },
        updatedAt: { type: Date, default: Date.now }
    },
    rating: {
        type: Number,
        default: 5.0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    completedDeliveries: {
        type: Number,
        default: 0
    },
    earnings: {
        total: { type: Number, default: 0 },
        today: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 }
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

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
module.exports = DeliveryPartner;
