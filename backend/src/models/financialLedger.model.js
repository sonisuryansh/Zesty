const mongoose = require('mongoose');

const financialLedgerSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'foodpartner',
        index: true
    },
    deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        index: true
    },
    type: {
        type: String,
        enum: [
            'CUSTOMER_PAYMENT',
            'PLATFORM_COMMISSION',
            'DELIVERY_EARNING',
            'RESTAURANT_SETTLEMENT',
            'REFUND',
            'ADJUSTMENT'
        ],
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true, // Integer in Paise
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    direction: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED'],
        default: 'COMPLETED',
        index: true
    },
    source: {
        type: String,
        default: 'SYSTEM'
    },
    referenceId: {
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

financialLedgerSchema.index({ createdAt: -1 });

const FinancialLedger = mongoose.model('FinancialLedger', financialLedgerSchema);
module.exports = FinancialLedger;
