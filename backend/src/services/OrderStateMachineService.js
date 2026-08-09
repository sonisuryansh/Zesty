const Order = require('../models/order.model');
const DeliveryEarning = require('../models/deliveryEarning.model');
const FinancialLedgerService = require('./FinancialLedgerService');
const deliveryPartnerModel = require('../models/deliverypartner.model');

// Valid State Transitions Map
const VALID_TRANSITIONS = {
    'PAYMENT_PENDING': ['PAYMENT_VERIFIED', 'PAID', 'CANCELLED', 'FAILED'],
    'PAYMENT_VERIFIED': ['PAID', 'RESTAURANT_PENDING', 'CANCELLED', 'REFUND_PENDING'],
    'PAID': ['RESTAURANT_PENDING', 'CANCELLED', 'REFUND_PENDING'],
    'RESTAURANT_PENDING': ['RESTAURANT_ACCEPTED', 'RESTAURANT_REJECTED', 'CANCELLED'],
    'RESTAURANT_ACCEPTED': ['PREPARING', 'CANCELLED', 'REFUND_PENDING'],
    'PREPARING': ['READY_FOR_PICKUP', 'CANCELLED'],
    'READY_FOR_PICKUP': ['DELIVERY_PARTNER_ASSIGNED', 'PICKED_UP', 'CANCELLED'],
    'DELIVERY_PARTNER_ASSIGNED': ['PICKED_UP', 'CANCELLED'],
    'PICKED_UP': ['OUT_FOR_DELIVERY', 'CANCELLED'],
    'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [],
    'RESTAURANT_REJECTED': ['REFUND_PENDING', 'REFUNDED'],
    'CANCELLED': ['REFUND_PENDING', 'REFUNDED'],
    'REFUND_PENDING': ['REFUNDED'],
    'REFUNDED': [],

    // Legacy Aliases Mapping & Transition Allowance
    'Placed': ['Accepted', 'RESTAURANT_ACCEPTED', 'RESTAURANT_REJECTED', 'Cancelled', 'CANCELLED', 'Preparing', 'PREPARING'],
    'Accepted': ['Preparing', 'PREPARING', 'Ready', 'READY_FOR_PICKUP', 'Cancelled', 'CANCELLED'],
    'Preparing': ['Ready', 'READY_FOR_PICKUP', 'Cancelled', 'CANCELLED'],
    'Ready': ['Assigned Rider', 'DELIVERY_PARTNER_ASSIGNED', 'Picked Up', 'PICKED_UP', 'Cancelled', 'CANCELLED'],
    'Assigned Rider': ['Picked Up', 'PICKED_UP', 'Cancelled', 'CANCELLED'],
    'Picked Up': ['Out for Delivery', 'OUT_FOR_DELIVERY', 'Cancelled', 'CANCELLED'],
    'Out for Delivery': ['Delivered', 'DELIVERED', 'Cancelled', 'CANCELLED']
};

class OrderStateMachineService {
    /**
     * Normalize status string
     */
    static normalizeStatus(status) {
        const aliasMap = {
            'Placed': 'RESTAURANT_PENDING',
            'Accepted': 'RESTAURANT_ACCEPTED',
            'Preparing': 'PREPARING',
            'Ready': 'READY_FOR_PICKUP',
            'Assigned Rider': 'DELIVERY_PARTNER_ASSIGNED',
            'Picked Up': 'PICKED_UP',
            'Out for Delivery': 'OUT_FOR_DELIVERY',
            'Delivered': 'DELIVERED',
            'Cancelled': 'CANCELLED'
        };
        return aliasMap[status] || status;
    }

    /**
     * Validate if state transition is allowed
     */
    static canTransition(currentStatus, targetStatus) {
        const allowed = VALID_TRANSITIONS[currentStatus] || [];
        const normTarget = this.normalizeStatus(targetStatus);
        return allowed.includes(targetStatus) || allowed.includes(normTarget);
    }

    /**
     * Transition Order to new status atomically
     */
    static async transition(orderId, targetStatus, metadata = {}) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('ORDER_NOT_FOUND');
        }

        const currentStatus = order.status;
        const normalizedTarget = this.normalizeStatus(targetStatus);

        if (!this.canTransition(currentStatus, targetStatus)) {
            throw new Error(`INVALID_ORDER_TRANSITION: Cannot transition from ${currentStatus} to ${targetStatus}`);
        }

        // Apply Status Update
        order.status = normalizedTarget;
        order.timeline.push({
            status: normalizedTarget,
            timestamp: new Date()
        });

        // Trigger Lifecycle Side Effects based on new state
        if (normalizedTarget === 'PAID' || normalizedTarget === 'PAYMENT_VERIFIED') {
            order.payment.status = 'PAID';
            order.payment.verifiedAt = new Date();

            // Reserve Delivery Earning
            const earningAmountPaise = order.settlement?.deliveryPartnerAmountPaise || Math.round((order.financialBreakdown?.deliveryPartnerCommission || 0) * 100);
            await DeliveryEarning.findOneAndUpdate(
                { orderId: order._id },
                {
                    orderId: order._id,
                    deliveryPartnerId: order.deliveryPartner,
                    earningAmount: earningAmountPaise,
                    status: 'RESERVED'
                },
                { upsert: true, returnDocument: 'after' }
            );

            // Automatically make available to restaurant
            order.status = 'RESTAURANT_PENDING';
            order.timeline.push({ status: 'RESTAURANT_PENDING', timestamp: new Date() });
        }

        if (normalizedTarget === 'DELIVERED') {
            order.payment.status = 'PAID';

            // Release Delivery Partner Earning
            if (order.deliveryPartner) {
                const earningPaise = order.settlement?.deliveryPartnerAmountPaise || Math.round((order.financialBreakdown?.deliveryPartnerCommission || 0) * 100);
                const earningRupees = Math.round(earningPaise / 100);

                await DeliveryEarning.findOneAndUpdate(
                    { orderId: order._id },
                    {
                        status: 'RELEASED',
                        releasedAt: new Date(),
                        deliveryPartnerId: order.deliveryPartner
                    }
                );

                // Record Delivery Earning in Financial Ledger
                await FinancialLedgerService.recordDeliveryEarning({
                    order,
                    deliveryPartnerId: order.deliveryPartner,
                    status: 'RELEASED'
                });

                // Increment Delivery Partner Account Earnings
                await deliveryPartnerModel.findByIdAndUpdate(order.deliveryPartner, {
                    $inc: {
                        'earnings.total': earningRupees,
                        'earnings.today': earningRupees,
                        completedDeliveries: 1
                    },
                    dutyStatus: 'online'
                });

                order.settlement.deliveryPartnerStatus = 'RELEASED';
            }

            // Record Platform Commission & Restaurant Settlement in Financial Ledger
            await FinancialLedgerService.recordPlatformCommission({ order });
            await FinancialLedgerService.recordRestaurantSettlement({ order, status: 'COMPLETED' });

            order.settlement.restaurantStatus = 'COMPLETED';
            order.settlement.platformStatus = 'EARNED';
        }

        if (normalizedTarget === 'RESTAURANT_REJECTED' || normalizedTarget === 'CANCELLED') {
            order.cancellationReason = metadata.reason || 'Order cancelled/rejected';

            // Reverse Delivery Earning & Settlements if previously reserved or pending
            await DeliveryEarning.findOneAndUpdate(
                { orderId: order._id },
                { status: 'REVERSED' }
            );

            order.settlement.restaurantStatus = 'REVERSED';
            order.settlement.platformStatus = 'REVERSED';
            order.settlement.deliveryPartnerStatus = 'REVERSED';
        }

        await order.save();
        return order;
    }
}

module.exports = OrderStateMachineService;
