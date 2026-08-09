/**
 * Settlement Calculation Policy Service
 * Explicitly calculates net settlement amounts for Restaurants, Platform, and Delivery Partners.
 */
class SettlementService {
    /**
     * Calculate explicit settlement details for an order in Paise.
     */
    static calculateSettlement({ pricing, commission }) {
        const foodSubtotalPaise = pricing.foodSubtotalPaise || 0;
        const packagingChargePaise = pricing.packagingChargePaise || 0;
        const taxAmountPaise = pricing.taxAmountPaise || 0;
        const deliveryChargePaise = pricing.deliveryChargePaise || 0;
        const totalAmountPaise = pricing.totalAmountPaise || 0;

        const platformCommissionPaise = commission?.platform?.amountPaise || Math.round(foodSubtotalPaise * 0.05);
        const deliveryPartnerEarningPaise = commission?.deliveryPartner?.amountPaise || Math.round(foodSubtotalPaise * 0.05);

        // Restaurant settlement formula:
        // Net Restaurant Earnings = (Food Subtotal - Platform Commission) + Packaging Charge + Tax
        const restaurantAmountPaise = Math.max(0, (foodSubtotalPaise - platformCommissionPaise) + packagingChargePaise + taxAmountPaise);

        return {
            restaurantAmountPaise,
            platformAmountPaise: platformCommissionPaise,
            deliveryPartnerAmountPaise: deliveryPartnerEarningPaise,

            // Rupee equivalents for legacy compatibility
            financialBreakdown: {
                foodSubtotal: Math.round(foodSubtotalPaise / 100),
                packagingCharge: Math.round(packagingChargePaise / 100),
                gst: Math.round(taxAmountPaise / 100),
                deliveryCharge: Math.round(deliveryChargePaise / 100),
                customerTotal: Math.round(totalAmountPaise / 100),
                platformCommission: Math.round(platformCommissionPaise / 100),
                restaurantEarnings: Math.round(restaurantAmountPaise / 100),
                deliveryPartnerCommission: Math.round(deliveryPartnerEarningPaise / 100)
            }
        };
    }
}

module.exports = SettlementService;
