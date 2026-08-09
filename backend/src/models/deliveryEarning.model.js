const mongoose = require('mongoose');

const deliveryEarningSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true,
        index: true
    },
    deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        index: true
    },
    earningAmount: {
        type: Number,
        required: true, // in paise
        min: 0
    },
    status: {
        type: String,
        enum: ['RESERVED', 'PENDING', 'ELIGIBLE', 'RELEASED', 'PAID_OUT', 'REVERSED'],
        default: 'RESERVED',
        index: true
    },
    releasedAt: {
        type: Date
    },
    payoutReference: {
        type: String,
        default: ''
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

const DeliveryEarning = mongoose.model('DeliveryEarning', deliveryEarningSchema);
module.exports = DeliveryEarning;
