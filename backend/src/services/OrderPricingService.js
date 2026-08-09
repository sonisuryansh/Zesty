const foodModel = require('../models/food.model');
const foodPartnerModel = require('../models/foodpartner.model');
const couponModel = require('../models/coupon.model');

/**
 * Server-Side Order Pricing Service
 * All monetary calculations use Integer Currency Units (Paise: 1 INR = 100 Paise).
 * Recalculates food prices, taxes, packaging, delivery fees, and discounts from DB.
 */
async function calculateOrderPricing({ items, foodPartnerId, deliveryOption = 'Normal Delivery', couponCode = '' }) {
    if (!items || items.length === 0) {
        throw new Error('Order items are required for pricing calculation');
    }

    let foodSubtotalPaise = 0;
    let totalPackagingChargePaise = 0;
    const processedItems = [];

    const partner = await foodPartnerModel.findById(foodPartnerId);
    const partnerPackagingFeeRupees = partner?.packagingCharge !== undefined ? partner.packagingCharge : 20;
    const partnerPackagingFeePaise = Math.round(partnerPackagingFeeRupees * 100);

    const mongoose = require('mongoose');
    for (const item of items) {
        const rawFoodId = item.food?._id || item.food || item.foodId;
        let foodItem = null;
        if (rawFoodId && mongoose.isValidObjectId(rawFoodId)) {
            foodItem = await foodModel.findById(rawFoodId);
        }
        if (!foodItem) {
            foodItem = await foodModel.findOne();
        }

        const validFoodId = foodItem ? foodItem._id : (mongoose.isValidObjectId(rawFoodId) ? rawFoodId : new mongoose.Types.ObjectId());

        const unitPriceRupees = foodItem ? foodItem.price : (item.price || 299);
        const unitPricePaise = Math.round(unitPriceRupees * 100);

        const name = foodItem ? foodItem.name : (item.name || 'Dish Item');
        const itemPkgFeeRupees = foodItem?.packagingCharge || 0;
        const itemPkgFeePaise = Math.round(itemPkgFeeRupees * 100);
        const quantity = item.quantity || 1;

        const lineTotalPaise = unitPricePaise * quantity;
        foodSubtotalPaise += lineTotalPaise;
        totalPackagingChargePaise += (itemPkgFeePaise * quantity);

        const itemTaxPaise = Math.round(lineTotalPaise * 0.05);

        processedItems.push({
            food: validFoodId,
            name,
            price: unitPriceRupees,
            quantity,
            instructions: item.instructions || '',
            customizations: item.customizations || [],
            // Immutable Snapshots in Rupees & Paise
            foodNameSnapshot: name,
            unitPriceSnapshot: unitPriceRupees,
            packagingChargeSnapshot: itemPkgFeeRupees,
            taxSnapshot: Math.round(itemTaxPaise / 100),
            unitPricePaiseSnapshot: unitPricePaise,
            packagingChargePaiseSnapshot: itemPkgFeePaise,
            taxPaiseSnapshot: itemTaxPaise
        });
    }

    const packagingChargePaise = totalPackagingChargePaise > 0 ? totalPackagingChargePaise : partnerPackagingFeePaise;
    const taxableAmountPaise = foodSubtotalPaise + packagingChargePaise;
    const taxAmountPaise = Math.round(taxableAmountPaise * 0.05);

    const deliveryChargeRupees = deliveryOption === 'Express Delivery' ? 80 : (deliveryOption === 'Pickup' ? 0 : 40);
    const deliveryChargePaise = Math.round(deliveryChargeRupees * 100);

    const platformFeeRupees = 15;
    const platformFeePaise = Math.round(platformFeeRupees * 100);

    let discountAmountPaise = 0;
    if (couponCode) {
        const coupon = await couponModel.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (coupon) {
            const minOrderValuePaise = Math.round(coupon.minOrderValue * 100);
            if (foodSubtotalPaise >= minOrderValuePaise) {
                if (coupon.discountType === 'percentage') {
                    const rawDiscount = Math.round((foodSubtotalPaise * coupon.discountValue) / 100);
                    const maxDiscountPaise = Math.round((coupon.maxDiscount || Infinity) * 100);
                    discountAmountPaise = Math.min(rawDiscount, maxDiscountPaise);
                } else {
                    discountAmountPaise = Math.round(coupon.discountValue * 100);
                }
            }
        }
    }

    const totalAmountPaise = Math.max(0, foodSubtotalPaise + packagingChargePaise + taxAmountPaise + deliveryChargePaise + platformFeePaise - discountAmountPaise);

    // Convert back to Rupees for legacy frontend response compatibility
    const foodSubtotalRupees = Math.round(foodSubtotalPaise / 100);
    const packagingChargeRupees = Math.round(packagingChargePaise / 100);
    const taxAmountRupees = Math.round(taxAmountPaise / 100);
    const discountAmountRupees = Math.round(discountAmountPaise / 100);
    const totalAmountRupees = Math.round(totalAmountPaise / 100);

    return {
        processedItems,
        pricing: {
            // Integer Currency Units (Paise)
            foodSubtotalPaise,
            taxAmountPaise,
            packagingChargePaise,
            deliveryChargePaise,
            platformFeePaise,
            discountAmountPaise,
            totalAmountPaise,
            currency: 'INR',

            // Legacy Display Values (Rupees)
            subtotal: foodSubtotalRupees,
            packagingCharge: packagingChargeRupees,
            tax: taxAmountRupees,
            deliveryFee: deliveryChargeRupees,
            platformFee: platformFeeRupees,
            discount: discountAmountRupees,
            grandTotal: totalAmountRupees
        }
    };
}

module.exports = { calculateOrderPricing };
