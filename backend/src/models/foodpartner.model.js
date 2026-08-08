const mongoose = require('mongoose');

const foodPartenerSchema = new mongoose.Schema({
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
        type: String
    },
    phone: {
        type: String,
        sparse: true
    },
    googleId: {
        type: String,
        sparse: true
    },
    avatar: String,
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    // Partner Verification Details
    verificationDetails: {
        restaurantName: String,
        fssaiNumber: String,
        gstNumber: String,
        restaurantImage: String,
        address: String,
        ownerName: String,
        ownerContact: String
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    isOnline: {
        type: Boolean,
        default: true
    },
    packagingCharge: {
        type: Number,
        default: 20
    },
    cuisine: {
        type: String,
        default: 'Multi-Cuisine'
    },
    rating: {
        type: Number,
        default: 4.8
    },
    totalRatings: {
        type: Number,
        default: 24
    },
    location: {
        latitude: { type: Number, default: 28.6139 },
        longitude: { type: Number, default: 77.2090 },
        address: { type: String, default: 'Connaught Place, New Delhi' },
        city: { type: String, default: 'New Delhi' }
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
}, { timestamps: true });

const foodPartnerModel = mongoose.model("foodpartner", foodPartenerSchema);

module.exports = foodPartnerModel;