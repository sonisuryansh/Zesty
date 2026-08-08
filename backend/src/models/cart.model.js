const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 299 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    instructions: { type: String, default: '' },
    customizations: [{ type: String }]
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'foodpartner'
    },
    items: [cartItemSchema],
    subtotal: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
