const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    instructions: { type: String, default: '' },
    customizations: [{ type: String }],
    // Immutable Price Snapshots (in Paise & Rupees)
    foodNameSnapshot: { type: String },
    unitPriceSnapshot: { type: Number },
    packagingChargeSnapshot: { type: Number, default: 0 },
    taxSnapshot: { type: Number, default: 0 },
    unitPricePaiseSnapshot: { type: Number, default: 0 },
    packagingChargePaiseSnapshot: { type: Number, default: 0 },
    taxPaiseSnapshot: { type: Number, default: 0 }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'foodpartner',
        required: true,
        index: true
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        index: true
    },
    items: [orderItemSchema],
    deliveryAddress: {
        label: String,
        fullName: String,
        phone: String,
        houseNumber: String,
        street: String,
        area: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String,
        latitude: Number,
        longitude: Number,
        deliveryInstructions: String
    },
    // Integer Currency Units (Paise) & Rupee Compatibility Snapshots
    pricing: {
        foodSubtotalPaise: { type: Number, default: 0 },
        taxAmountPaise: { type: Number, default: 0 },
        packagingChargePaise: { type: Number, default: 0 },
        deliveryChargePaise: { type: Number, default: 0 },
        platformFeePaise: { type: Number, default: 0 },
        discountAmountPaise: { type: Number, default: 0 },
        totalAmountPaise: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },

        // Legacy / Display Rupee Snapshots
        subtotal: { type: Number, required: true },
        packagingCharge: { type: Number, default: 20 },
        tax: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 40 },
        platformFee: { type: Number, default: 15 },
        discount: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true }
    },
    // Commission Snapshot
    commission: {
        baseAmountPaise: { type: Number, default: 0 },
        platform: {
            percentage: { type: Number, default: 5 },
            amountPaise: { type: Number, default: 0 }
        },
        deliveryPartner: {
            percentage: { type: Number, default: 5 },
            amountPaise: { type: Number, default: 0 }
        },
        totalCommissionPaise: { type: Number, default: 0 }
    },
    // Settlement Breakdown Snapshot
    settlement: {
        restaurantAmountPaise: { type: Number, default: 0 },
        restaurantStatus: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'REVERSED', 'FAILED'],
            default: 'PENDING'
        },
        platformAmountPaise: { type: Number, default: 0 },
        platformStatus: {
            type: String,
            enum: ['PENDING', 'EARNED', 'REVERSED'],
            default: 'PENDING'
        },
        deliveryPartnerAmountPaise: { type: Number, default: 0 },
        deliveryPartnerStatus: {
            type: String,
            enum: ['RESERVED', 'PENDING', 'ELIGIBLE', 'RELEASED', 'PAID_OUT', 'REVERSED'],
            default: 'RESERVED'
        }
    },
    financialBreakdown: {
        foodSubtotal: { type: Number, default: 0 },
        packagingCharge: { type: Number, default: 0 },
        gst: { type: Number, default: 0 },
        deliveryCharge: { type: Number, default: 0 },
        customerTotal: { type: Number, default: 0 },
        platformCommission: { type: Number, default: 0 },
        restaurantEarnings: { type: Number, default: 0 },
        deliveryPartnerCommission: { type: Number, default: 0 }
    },
    couponCode: { type: String, default: '' },
    deliveryOption: {
        type: String,
        enum: ['Normal Delivery', 'Express Delivery', 'Scheduled Delivery', 'Pickup'],
        default: 'Normal Delivery'
    },
    // Gateway Payment Details
    payment: {
        method: {
            type: String,
            enum: ['COD', 'Stripe', 'Razorpay', 'UPI', 'Wallet'],
            default: 'COD'
        },
        gateway: { type: String, default: 'COD' },
        gatewayOrderId: { type: String, default: '', index: true },
        gatewayPaymentId: { type: String, default: '' },
        gatewaySignature: { type: String, default: '' },
        amountPaise: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        status: {
            type: String,
            enum: ['PENDING', 'Pending', 'PAID', 'Completed', 'FAILED', 'Failed', 'REFUND_PENDING', 'REFUNDED', 'Refunded', 'PARTIALLY_REFUNDED'],
            default: 'PENDING'
        },
        verifiedAt: { type: Date },
        idempotencyKey: { type: String, sparse: true },
        transactionId: { type: String, default: '' }
    },
    status: {
        type: String,
        enum: [
            'PAYMENT_PENDING',
            'PAYMENT_VERIFIED',
            'PAID',
            'RESTAURANT_PENDING',
            'RESTAURANT_ACCEPTED',
            'RESTAURANT_REJECTED',
            'PREPARING',
            'READY_FOR_PICKUP',
            'DELIVERY_PARTNER_ASSIGNED',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'CANCELLED',
            'REFUND_PENDING',
            'REFUNDED',
            // Legacy Status Aliases for backward compatibility
            'Placed',
            'Accepted',
            'Preparing',
            'Ready',
            'Assigned Rider',
            'Picked Up',
            'Out for Delivery',
            'Delivered',
            'Cancelled'
        ],
        default: 'PAYMENT_PENDING',
        index: true
    },
    otp: {
        type: String,
        default: '1234'
    },
    ratings: {
        food: { type: Number, default: 0 },
        delivery: { type: Number, default: 0 },
        restaurant: { type: Number, default: 0 },
        comment: { type: String, default: '' }
    },
    cancellationReason: { type: String, default: '' },
    timeline: [{
        status: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

