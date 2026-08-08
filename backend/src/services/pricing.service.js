const foodModel = require('../models/food.model');
const foodPartnerModel = require('../models/foodpartner.model');
const couponModel = require('../models/coupon.model');

/**
 * Centralized Server-Side Pricing & Financial Settlement Service
 * Calculates transparent customer pricing and explicit financial ledger breakdowns:
 * - Customer Total = Food Subtotal + Packaging + GST (5%) + Delivery Fee - Discount
 * - Platform Food Commission = 5% of Food Subtotal
 * - Restaurant Net Earnings = (Food Subtotal - Platform Commission) + Packaging Charge
 * - Delivery Partner Commission = 5% of Customer Total
 */
async function calculateOrderPricing({ items, foodPartnerId, deliveryOption = 'Normal Delivery', couponCode = '' }) {
    if (!items || items.length === 0) {
        throw new Error('Order items are required for pricing calculation');
    }

    let foodSubtotal = 0;
    let totalPackagingCharge = 0;
    const processedItems = [];

    // Fetch partner default packaging charge
    const partner = await foodPartnerModel.findById(foodPartnerId);
    const partnerPackagingFee = partner?.packagingCharge !== undefined ? partner.packagingCharge : 20;

    for (const item of items) {
        const foodId = item.food?._id || item.food || item.foodId;
        const foodItem = await foodModel.findById(foodId);

        const unitPrice = foodItem ? foodItem.price : (item.price || 299);
        const name = foodItem ? foodItem.name : (item.name || 'Dish Item');
        const itemPkgFee = foodItem?.packagingCharge || 0;
        const quantity = item.quantity || 1;

        const lineTotal = unitPrice * quantity;
        foodSubtotal += lineTotal;
        totalPackagingCharge += (itemPkgFee * quantity);

        processedItems.push({
            food: foodId,
            name,
            price: unitPrice,
            quantity,
            instructions: item.instructions || '',
            customizations: item.customizations || [],
            // Immutable Price Snapshots
            foodNameSnapshot: name,
            unitPriceSnapshot: unitPrice,
            packagingChargeSnapshot: itemPkgFee,
            taxSnapshot: Math.round(lineTotal * 0.05)
        });
    }

    // Default to restaurant order-level packaging charge if item-level pkg fee is 0
    const packagingCharge = totalPackagingCharge > 0 ? totalPackagingCharge : partnerPackagingFee;

    // GST 5% calculated on (Food Subtotal + Packaging Charge)
    const taxableAmount = foodSubtotal + packagingCharge;
    const gst = Math.round(taxableAmount * 0.05);

    // Delivery Fee calculation
    const deliveryCharge = deliveryOption === 'Express Delivery' ? 80 : 40;
    const platformFee = 15;

    // Coupon Discount calculation
    let discount = 0;
    if (couponCode) {
        const coupon = await couponModel.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (coupon && foodSubtotal >= coupon.minOrderValue) {
            if (coupon.discountType === 'percentage') {
                discount = Math.min((foodSubtotal * coupon.discountValue) / 100, coupon.maxDiscount);
            } else {
                discount = coupon.discountValue;
            }
        }
    }

    const customerTotal = Math.max(0, foodSubtotal + packagingCharge + gst + deliveryCharge + platformFee - discount);

    // Commission Calculations
    // 1. Platform Commission = 5% of Food Subtotal
    const platformCommission = Math.round((foodSubtotal * 0.05) * 100) / 100;

    // 2. Restaurant Earnings = (Food Subtotal - Platform Commission) + Packaging Charge
    const restaurantEarnings = Math.round(((foodSubtotal - platformCommission) + packagingCharge) * 100) / 100;

    // 3. Delivery Partner Commission = 5% of Customer Total
    const deliveryPartnerCommission = Math.round((customerTotal * 0.05) * 100) / 100;

    return {
        processedItems,
        pricing: {
            subtotal: foodSubtotal,
            packagingCharge,
            tax: gst,
            deliveryFee: deliveryCharge,
            platformFee,
            discount,
            grandTotal: customerTotal
        },
        financialBreakdown: {
            foodSubtotal,
            packagingCharge,
            gst,
            deliveryCharge,
            customerTotal,
            platformCommission,
            restaurantEarnings,
            deliveryPartnerCommission
        }
    };
}

module.exports = { calculateOrderPricing };
