const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    provider: {
        type: String,
        default: 'RAZORPAY',
        index: true
    },
    eventType: {
        type: String,
        required: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['RECEIVED', 'PROCESSED', 'FAILED', 'DUPLICATE'],
        default: 'RECEIVED',
        index: true
    },
    processedAt: {
        type: Date
    },
    errorMessage: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
module.exports = WebhookEvent;
