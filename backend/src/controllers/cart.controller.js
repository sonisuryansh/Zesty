const mongoose = require('mongoose');
const cartModel = require('../models/cart.model');
const foodModel = require('../models/food.model');
const foodPartnerModel = require('../models/foodpartner.model');

// Get User Cart
async function getCart(req, res) {
    try {
        let cart = await cartModel.findOne({ user: req.user._id })
            .populate('items.food')
            .populate('foodPartner', 'name email isOnline rating location');

        if (!cart) {
            cart = await cartModel.create({ user: req.user._id, items: [], subtotal: 0 });
        }

        res.status(200).json({ cart });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Add Item to Cart
async function addToCart(req, res) {
    try {
        const { foodId, quantity = 1, instructions = '', customizations = [], clearAndAdd = false } = req.body;
        const food = await foodModel.findById(foodId).populate('foodPartner');
        if (!food) return res.status(404).json({ message: "Food item not found" });

        // Restaurant Online Check
        if (food.foodPartner && food.foodPartner.isOnline === false) {
            return res.status(400).json({
                message: "Restaurant is currently closed. Cannot add items to cart."
            });
        }

        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            cart = new cartModel({ user: req.user._id, items: [], subtotal: 0 });
        }

        // Single restaurant cart rule
        if (cart.foodPartner && cart.foodPartner.toString() !== food.foodPartner._id.toString() && cart.items.length > 0) {
            if (!clearAndAdd) {
                const currentPartner = await foodPartnerModel.findById(cart.foodPartner).select('name');
                return res.status(409).json({
                    code: 'CART_RESTAURANT_MISMATCH',
                    message: `Your cart contains items from ${currentPartner?.name || 'another restaurant'}. Would you like to clear your cart and add this item?`,
                    existingRestaurant: currentPartner?.name || 'another restaurant',
                    newRestaurant: food.foodPartner.name
                });
            }
            // Clear cart for new restaurant if confirmed
            cart.foodPartner = food.foodPartner._id;
            cart.items = [];
        } else {
            cart.foodPartner = food.foodPartner._id;
        }

        const existingIndex = cart.items.findIndex(item => item.food.toString() === foodId);
        const itemPrice = food.price || 299;

        if (existingIndex > -1) {
            cart.items[existingIndex].quantity += quantity;
            cart.items[existingIndex].instructions = instructions || cart.items[existingIndex].instructions;
        } else {
            cart.items.push({
                food: food._id,
                name: food.name,
                price: itemPrice,
                quantity,
                instructions,
                customizations
            });
        }

        cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await cart.save();

        const populatedCart = await cartModel.findById(cart._id)
            .populate('items.food')
            .populate('foodPartner', 'name email isOnline rating location');

        res.status(200).json({ message: "Item added to cart", cart: populatedCart });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Update Item Quantity
async function updateCartItemQuantity(req, res) {
    try {
        const { itemId, action } = req.body; // action: 'inc' or 'dec'
        const cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const item = cart.items.id(itemId);
        if (!item) return res.status(404).json({ message: "Item not in cart" });

        if (action === 'inc') {
            item.quantity += 1;
        } else if (action === 'dec') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                cart.items.pull(itemId);
            }
        }

        if (cart.items.length === 0) {
            cart.foodPartner = null;
        }

        cart.subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        await cart.save();

        res.status(200).json({ message: "Cart updated", cart });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Clear Cart
async function clearCart(req, res) {
    try {
        let cart = await cartModel.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            cart.foodPartner = null;
            cart.subtotal = 0;
            await cart.save();
        }
        res.status(200).json({ message: "Cart cleared", cart });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Merge Guest Cart into User Cart upon Login
async function mergeGuestCart(req, res) {
    try {
        if (!req.user || !req.user._id || !mongoose.isValidObjectId(req.user._id)) {
            return res.status(401).json({ message: "Authentication required for cart merge" });
        }

        const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
        const clearAndAdd = Boolean(req.body?.clearAndAdd);

        // Filter valid items with valid Mongoose ObjectIds
        const validGuestItems = rawItems.filter(item => {
            const id = item?._id || item?.food || item?.foodId;
            return id && mongoose.isValidObjectId(id);
        });

        if (validGuestItems.length === 0) {
            let userCart = await cartModel.findOne({ user: req.user._id })
                .populate('items.food')
                .populate('foodPartner', 'name email isOnline rating location');
            
            if (!userCart) {
                userCart = { items: [], subtotal: 0, foodPartner: null };
            }
            return res.status(200).json({ message: "Guest cart empty, existing cart preserved", cart: userCart });
        }

        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            cart = new cartModel({ user: req.user._id, items: [], subtotal: 0 });
        }

        // Get first valid food item to identify restaurant
        const firstFoodId = (validGuestItems[0]._id || validGuestItems[0].food || validGuestItems[0].foodId).toString();
        const firstFood = await foodModel.findById(firstFoodId);

        if (firstFood && firstFood.foodPartner) {
            const newPartnerId = firstFood.foodPartner.toString();
            if (cart.foodPartner && cart.foodPartner.toString() !== newPartnerId && cart.items.length > 0) {
                if (!clearAndAdd) {
                    const currentPartner = await foodPartnerModel.findById(cart.foodPartner).select('name');
                    const newPartner = await foodPartnerModel.findById(firstFood.foodPartner).select('name');
                    return res.status(409).json({
                        code: 'CART_RESTAURANT_MISMATCH',
                        message: `Your account cart contains items from ${currentPartner?.name || 'another restaurant'}. Would you like to replace it with guest cart items from ${newPartner?.name || 'the new restaurant'}?`,
                        existingRestaurant: currentPartner?.name || 'another restaurant',
                        newRestaurant: newPartner?.name || 'new restaurant'
                    });
                }
                cart.items = [];
                cart.foodPartner = firstFood.foodPartner;
            } else {
                cart.foodPartner = firstFood.foodPartner;
            }
        }

        for (const guestItem of validGuestItems) {
            const fId = (guestItem._id || guestItem.food || guestItem.foodId).toString();
            const dbFood = await foodModel.findById(fId);
            if (!dbFood || dbFood.isAvailable === false) continue;

            const existingIdx = cart.items.findIndex(i => {
                const itemId = (i.food?._id || i.food)?.toString();
                return itemId === fId;
            });

            const price = dbFood.price || Number(guestItem.price) || 0;
            const qty = Math.max(1, Number(guestItem.quantity) || 1);

            if (existingIdx > -1) {
                cart.items[existingIdx].quantity += qty;
            } else {
                cart.items.push({
                    food: dbFood._id,
                    name: dbFood.name,
                    price,
                    quantity: qty,
                    instructions: guestItem.instructions || ''
                });
            }
        }

        cart.subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        await cart.save();

        const populatedCart = await cartModel.findById(cart._id)
            .populate('items.food')
            .populate('foodPartner', 'name email isOnline rating location');

        return res.status(200).json({ message: "Guest cart merged successfully", cart: populatedCart });
    } catch (err) {
        console.error("❌ Cart merge failed:", err.message);
        return res.status(400).json({ message: err.message || "Failed to merge guest cart" });
    }
}

module.exports = {
    getCart,
    addToCart,
    updateCartItemQuantity,
    clearCart,
    mergeGuestCart
};
