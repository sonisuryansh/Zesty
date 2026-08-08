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
    // Immutable Price Snapshots
    foodNameSnapshot: { type: String },
    unitPriceSnapshot: { type: Number },
    packagingChargeSnapshot: { type: Number, default: 0 },
    taxSnapshot: { type: Number, default: 0 }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'foodpartner',
        required: true
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner'
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
    pricing: {
        subtotal: { type: Number, required: true },
        packagingCharge: { type: Number, default: 20 },
        tax: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 40 },
        platformFee: { type: Number, default: 15 },
        discount: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true }
    },
    financialBreakdown: {
        foodSubtotal: { type: Number, default: 0 },
        packagingCharge: { type: Number, default: 0 },
        gst: { type: Number, default: 0 },
        deliveryCharge: { type: Number, default: 0 },
        customerTotal: { type: Number, default: 0 },
        platformCommission: { type: Number, default: 0 }, // 5% of food subtotal
        restaurantEarnings: { type: Number, default: 0 }, // (foodSubtotal - commission) + packaging
        deliveryPartnerCommission: { type: Number, default: 0 } // 5% of customer total
    },
    couponCode: { type: String, default: '' },
    deliveryOption: {
        type: String,
        enum: ['Normal Delivery', 'Express Delivery', 'Scheduled Delivery', 'Pickup'],
        default: 'Normal Delivery'
    },
    payment: {
        method: {
            type: String,
            enum: ['COD', 'Stripe', 'Razorpay', 'UPI', 'Wallet'],
            default: 'COD'
        },
        status: {
            type: String,
            enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
            default: 'Pending'
        },
        transactionId: { type: String, default: '' }
    },
    status: {
        type: String,
        enum: ['Placed', 'Accepted', 'Preparing', 'Ready', 'Assigned Rider', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Placed'
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

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
