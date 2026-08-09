const WebhookEvent = require('../models/webhookEvent.model');
const Order = require('../models/order.model');
const PaymentProviderService = require('./PaymentProviderService');
const OrderStateMachineService = require('./OrderStateMachineService');
const FinancialLedgerService = require('./FinancialLedgerService');

class WebhookService {
    /**
     * Process Payment Gateway Webhook Event safely with Idempotency
     */
    static async handlePaymentWebhook({ rawBody, headers, body }) {
        const signature = headers['x-razorpay-signature'] || headers['stripe-signature'] || headers['x-signature'];

        // 1. Webhook Signature Verification
        const isValidSignature = PaymentProviderService.verifyWebhookSignature(rawBody, signature);
        if (!isValidSignature) {
            throw new Error('INVALID_PAYMENT_SIGNATURE');
        }

        const eventPayload = body || {};
        const eventId = eventPayload.id || eventPayload.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const eventType = eventPayload.event || eventPayload.type || 'payment.authorized';

        // 2. Idempotency Protection Check
        const existingEvent = await WebhookEvent.findOne({ eventId });
        if (existingEvent) {
            return {
                idempotent: true,
                message: 'DUPLICATE_WEBHOOK_EVENT',
                eventId
            };
        }

        // Store webhook record
        const webhookRecord = await WebhookEvent.create({
            eventId,
            provider: PaymentProviderService.getProviderName(),
            eventType,
            payload: eventPayload,
            status: 'RECEIVED'
        });

        try {
            // Extract payment parameters from webhook payload
            const entity = eventPayload.payload?.payment?.entity || eventPayload.data?.object || eventPayload;
            const gatewayOrderId = entity.order_id || entity.gatewayOrderId;
            const gatewayPaymentId = entity.id || entity.gatewayPaymentId;

            if (gatewayOrderId) {
                const order = await Order.findOne({ 'payment.gatewayOrderId': gatewayOrderId });
                if (order) {
                    if (order.payment.status === 'PAID' || order.payment.status === 'Completed') {
                        webhookRecord.status = 'PROCESSED';
                        webhookRecord.processedAt = new Date();
                        await webhookRecord.save();

                        return {
                            idempotent: true,
                            message: 'ORDER_ALREADY_PAID',
                            order
                        };
                    }

                    // Update payment metadata
                    order.payment.gatewayPaymentId = gatewayPaymentId || order.payment.gatewayPaymentId;
                    order.payment.gatewaySignature = signature || order.payment.gatewaySignature;
                    order.payment.status = 'PAID';
                    order.payment.verifiedAt = new Date();
                    await order.save();

                    // Record customer payment in ledger
                    await FinancialLedgerService.recordCustomerPayment({
                        order,
                        paymentId: gatewayPaymentId || order.payment.gatewayOrderId,
                        gateway: PaymentProviderService.getProviderName()
                    });

                    // Transition Order to PAID -> RESTAURANT_PENDING
                    await OrderStateMachineService.transition(order._id, 'PAID');
                }
            }

            webhookRecord.status = 'PROCESSED';
            webhookRecord.processedAt = new Date();
            await webhookRecord.save();

            return {
                success: true,
                message: 'WEBHOOK_PROCESSED_SUCCESSFULLY',
                eventId
            };
        } catch (err) {
            webhookRecord.status = 'FAILED';
            webhookRecord.errorMessage = err.message;
            await webhookRecord.save();
            throw err;
        }
    }
}

module.exports = WebhookService;
