const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    categories: [{
        type: String
    }],
    deliveryChargeBase: {
        type: Number,
        default: 40
    },
    taxPercentage: {
        type: Number,
        default: 5
    },
    platformCommissionPercentage: {
        type: Number,
        default: 10
    },
    multiRestaurantCartEnabled: {
        type: Boolean,
        default: false
    },
    bannerAds: [{
        imageUrl: String,
        title: String,
        linkUrl: String,
        active: Boolean
    }],
    terms: {
        type: String,
        default: 'Standard terms and conditions for Zesty platform usage.'
    },
    privacyPolicy: {
        type: String,
        default: 'Your privacy is important to us at Zesty.'
    },
    faq: [{
        question: String,
        answer: String
    }]
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
