const mongoose = require('mongoose');

const commissionConfigSchema = new mongoose.Schema({
    platformCommissionPercentage: {
        type: Number,
        default: 5,
        required: true,
        min: 0,
        max: 100
    },
    deliveryPartnerPercentage: {
        type: Number,
        default: 5,
        required: true,
        min: 0,
        max: 100
    },
    commissionBase: {
        type: String,
        enum: ['FOOD_SUBTOTAL', 'GRAND_TOTAL'],
        default: 'FOOD_SUBTOTAL',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
    }
}, {
    timestamps: true
});

const CommissionConfig = mongoose.model('CommissionConfig', commissionConfigSchema);
module.exports = CommissionConfig;
