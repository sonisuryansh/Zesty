const CommissionConfig = require('../models/commissionConfig.model');

/**
 * Commission Calculation Service
 * Centralized, dynamic, and configurable commission calculation.
 * Default: 5% Platform Commission + 5% Delivery Partner Earning on Food Subtotal.
 */
class CommissionService {
    /**
     * Get active commission settings from database or fallback defaults.
     */
    static async getActiveConfig() {
        try {
            let config = await CommissionConfig.findOne({ active: true }).sort({ updatedAt: -1 });
            if (!config) {
                config = await CommissionConfig.create({
                    platformCommissionPercentage: Number(process.env.PLATFORM_COMMISSION_PERCENTAGE) || 5,
                    deliveryPartnerPercentage: Number(process.env.DELIVERY_PARTNER_PERCENTAGE) || 5,
                    commissionBase: 'FOOD_SUBTOTAL',
                    active: true
                });
            }
            return config;
        } catch (err) {
            return {
                platformCommissionPercentage: 5,
                deliveryPartnerPercentage: 5,
                commissionBase: 'FOOD_SUBTOTAL'
            };
        }
    }

    /**
     * Calculate commission breakdown for an order pricing object in Paise.
     */
    static async calculateCommission({ foodSubtotalPaise, totalAmountPaise }) {
        const config = await this.getActiveConfig();

        const baseAmountPaise = config.commissionBase === 'GRAND_TOTAL' ? totalAmountPaise : foodSubtotalPaise;

        const platformAmountPaise = Math.round((baseAmountPaise * config.platformCommissionPercentage) / 100);
        const deliveryPartnerAmountPaise = Math.round((baseAmountPaise * config.deliveryPartnerPercentage) / 100);
        const totalCommissionPaise = platformAmountPaise + deliveryPartnerAmountPaise;

        return {
            config: {
                platformCommissionPercentage: config.platformCommissionPercentage,
                deliveryPartnerPercentage: config.deliveryPartnerPercentage,
                commissionBase: config.commissionBase
            },
            snapshot: {
                baseAmountPaise,
                platform: {
                    percentage: config.platformCommissionPercentage,
                    amountPaise: platformAmountPaise
                },
                deliveryPartner: {
                    percentage: config.deliveryPartnerPercentage,
                    amountPaise: deliveryPartnerAmountPaise
                },
                totalCommissionPaise
            }
        };
    }
}

module.exports = CommissionService;
