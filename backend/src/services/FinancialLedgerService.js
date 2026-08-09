const FinancialLedger = require('../models/financialLedger.model');
const crypto = require('crypto');

/**
 * Financial Ledger Service
 * Manages atomic, immutable ledger entries for every money movement.
 */
class FinancialLedgerService {
    /**
     * Generate unique transaction ID.
     */
    static generateTransactionId(prefix = 'TXN') {
        return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    /**
     * Record customer payment entry.
     */
    static async recordCustomerPayment({ order, paymentId, gateway = 'MOCK_GATEWAY' }) {
        const txnId = this.generateTransactionId('PAY');
        const amountPaise = order.pricing?.totalAmountPaise || Math.round(order.pricing?.grandTotal * 100);

        return await FinancialLedger.create({
            transactionId: txnId,
            orderId: order._id,
            userId: order.customer,
            restaurantId: order.foodPartner,
            deliveryPartnerId: order.deliveryPartner,
            type: 'CUSTOMER_PAYMENT',
            amount: amountPaise,
            currency: order.pricing?.currency || 'INR',
            direction: 'CREDIT',
            status: 'COMPLETED',
            source: gateway,
            referenceId: paymentId || order.payment?.gatewayPaymentId || txnId,
            metadata: {
                orderNumber: order.orderNumber,
                paymentMethod: order.payment?.method || 'ONLINE'
            }
        });
    }

    /**
     * Record Zesty platform commission entry.
     */
    static async recordPlatformCommission({ order }) {
        const txnId = this.generateTransactionId('COM');
        const amountPaise = order.commission?.platform?.amountPaise || Math.round((order.financialBreakdown?.platformCommission || 0) * 100);

        return await FinancialLedger.create({
            transactionId: txnId,
            orderId: order._id,
            restaurantId: order.foodPartner,
            type: 'PLATFORM_COMMISSION',
            amount: amountPaise,
            currency: order.pricing?.currency || 'INR',
            direction: 'CREDIT',
            status: 'COMPLETED',
            source: 'COMMISSION_ENGINE',
            referenceId: order.orderNumber,
            metadata: {
                percentage: order.commission?.platform?.percentage || 5
            }
        });
    }

    /**
     * Record restaurant net settlement entry.
     */
    static async recordRestaurantSettlement({ order, status = 'PENDING' }) {
        const txnId = this.generateTransactionId('SET');
        const amountPaise = order.settlement?.restaurantAmountPaise || Math.round((order.financialBreakdown?.restaurantEarnings || 0) * 100);

        return await FinancialLedger.create({
            transactionId: txnId,
            orderId: order._id,
            restaurantId: order.foodPartner,
            type: 'RESTAURANT_SETTLEMENT',
            amount: amountPaise,
            currency: order.pricing?.currency || 'INR',
            direction: 'CREDIT',
            status,
            source: 'SETTLEMENT_SERVICE',
            referenceId: order.orderNumber,
            metadata: {
                foodSubtotalPaise: order.pricing?.foodSubtotalPaise,
                packagingChargePaise: order.pricing?.packagingChargePaise
            }
        });
    }

    /**
     * Record delivery partner earning reservation or release entry.
     */
    static async recordDeliveryEarning({ order, deliveryPartnerId, status = 'RELEASED' }) {
        const txnId = this.generateTransactionId('DEL');
        const amountPaise = order.settlement?.deliveryPartnerAmountPaise || Math.round((order.financialBreakdown?.deliveryPartnerCommission || 0) * 100);

        return await FinancialLedger.create({
            transactionId: txnId,
            orderId: order._id,
            deliveryPartnerId: deliveryPartnerId || order.deliveryPartner,
            type: 'DELIVERY_EARNING',
            amount: amountPaise,
            currency: order.pricing?.currency || 'INR',
            direction: 'CREDIT',
            status: status === 'RELEASED' ? 'COMPLETED' : 'PENDING',
            source: 'DELIVERY_SERVICE',
            referenceId: order.orderNumber,
            metadata: {
                status
            }
        });
    }

    /**
     * Record customer refund entry.
     */
    static async recordRefund({ order, refundAmountPaise, reason = 'Order cancelled or rejected' }) {
        const txnId = this.generateTransactionId('REF');
        const amountPaise = refundAmountPaise || order.pricing?.totalAmountPaise || Math.round(order.pricing?.grandTotal * 100);

        return await FinancialLedger.create({
            transactionId: txnId,
            orderId: order._id,
            userId: order.customer,
            restaurantId: order.foodPartner,
            deliveryPartnerId: order.deliveryPartner,
            type: 'REFUND',
            amount: amountPaise,
            currency: order.pricing?.currency || 'INR',
            direction: 'DEBIT',
            status: 'COMPLETED',
            source: 'REFUND_SERVICE',
            referenceId: order.payment?.gatewayPaymentId || order.orderNumber,
            metadata: {
                reason
            }
        });
    }
}

module.exports = FinancialLedgerService;
