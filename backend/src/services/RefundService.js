const Order = require('../models/order.model');
const PaymentProviderService = require('./PaymentProviderService');
const FinancialLedgerService = require('./FinancialLedgerService');

class RefundService {
    /**
     * Process order refund safely and idempotently.
     */
    static async processRefund({ orderId, reason = 'Order rejected by restaurant', requestedBy = 'SYSTEM' }) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('ORDER_NOT_FOUND');
        }

        // Prevent duplicate refunds
        if (order.payment?.status === 'REFUNDED' || order.payment?.status === 'Refunded') {
            return {
                alreadyRefunded: true,
                message: 'Order has already been refunded',
                order
            };
        }

        const amountPaise = order.pricing?.totalAmountPaise || Math.round((order.pricing?.grandTotal || 0) * 100);

        // Initiate gateway refund
        const refundResult = await PaymentProviderService.initiateRefund({
            gatewayPaymentId: order.payment?.gatewayPaymentId || order.payment?.transactionId,
            amountPaise,
            reason
        });

        // Update payment & order status
        order.payment.status = 'REFUNDED';
        order.status = 'REFUNDED';
        order.cancellationReason = reason;
        order.timeline.push({
            status: 'REFUNDED',
            timestamp: new Date()
        });

        order.settlement.restaurantStatus = 'REVERSED';
        order.settlement.platformStatus = 'REVERSED';
        order.settlement.deliveryPartnerStatus = 'REVERSED';

        await order.save();

        // Record refund in financial ledger
        await FinancialLedgerService.recordRefund({
            order,
            refundAmountPaise: amountPaise,
            reason
        });

        return {
            success: true,
            refundId: refundResult.refundId,
            amountPaise,
            order
        };
    }
}

module.exports = RefundService;
