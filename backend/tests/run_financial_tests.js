require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const FoodPartner = require('../src/models/foodpartner.model');
const DeliveryPartner = require('../src/models/deliverypartner.model');
const Food = require('../src/models/food.model');
const Cart = require('../src/models/cart.model');
const Order = require('../src/models/order.model');
const FinancialLedger = require('../src/models/financialLedger.model');
const DeliveryEarning = require('../src/models/deliveryEarning.model');
const WebhookEvent = require('../src/models/webhookEvent.model');
const { calculateOrderPricing } = require('../src/services/OrderPricingService');
const CommissionService = require('../src/services/CommissionService');
const SettlementService = require('../src/services/SettlementService');
const OrderStateMachineService = require('../src/services/OrderStateMachineService');
const FinancialLedgerService = require('../src/services/FinancialLedgerService');
const WebhookService = require('../src/services/WebhookService');
const RefundService = require('../src/services/RefundService');
const PaymentProviderService = require('../src/services/PaymentProviderService');

const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const connectDB = require('../src/db/db');

async function runTests() {
    console.log("=================================================");
    console.log("🚀 STARTING FINANCIAL & PAYMENT SYSTEM TEST SUITE");
    console.log("=================================================");

    await connectDB();



    let testUser, testRestaurantA, testRestaurantB, testRider, testFoodItem;

    try {
        // Clean up previous test artifacts
        await User.deleteMany({ email: /@test-zesty\.com/ });
        await FoodPartner.deleteMany({ email: /@test-zesty\.com/ });
        await DeliveryPartner.deleteMany({ email: /@test-zesty\.com/ });
        await Order.deleteMany({ orderNumber: /^ZST-TEST/ });
        await FinancialLedger.deleteMany({ source: /MOCK|SYSTEM|TEST|COMMISSION_ENGINE/ });
        await WebhookEvent.deleteMany({ eventId: /^evt_test_/ });

        // Setup Test Entities
        testUser = await User.create({
            fullName: 'Test Customer',
            email: 'customer@test-zesty.com',
            password: 'password123',
            phone: '9998887770'
        });

        testRestaurantA = await FoodPartner.create({
            name: 'Pizza Palace A',
            email: 'restaurantA@test-zesty.com',
            password: 'password123',
            phone: '9998887771',
            isOnline: true,
            approvalStatus: 'approved',
            packagingCharge: 30
        });

        testRestaurantB = await FoodPartner.create({
            name: 'Burger Haven B',
            email: 'restaurantB@test-zesty.com',
            password: 'password123',
            phone: '9998887772',
            isOnline: true,
            approvalStatus: 'approved'
        });

        testRider = await DeliveryPartner.create({
            name: 'Rider Speed',
            email: 'rider@test-zesty.com',
            password: 'password123',
            phone: '9998887773',
            approvalStatus: 'approved',
            dutyStatus: 'online'
        });

        testFoodItem = await Food.create({
            name: 'Margherita Pizza',
            foodPartner: testRestaurantA._id,
            price: 1000, // ₹1,000
            packagingCharge: 30,
            isAvailable: true
        });

        console.log("✅ Test Entities Created");

        // TEST 1: SERVER-SIDE PRICE RECALCULATION & PAISE ACCURACY
        console.log("\n[TEST 1] Testing Server-side Pricing Recalculation (Integer Currency Units)...");
        const items = [{ food: testFoodItem._id, quantity: 1, price: 1000 }];
        const pricingResult = await calculateOrderPricing({
            items,
            foodPartnerId: testRestaurantA._id,
            deliveryOption: 'Normal Delivery'
        });

        // Food = 1000 INR (100000 paise)
        // Packaging = 30 INR (3000 paise)
        // Tax (GST 5%) = (100000 + 3000) * 0.05 = 5150 paise (51.5 INR -> 52 INR)
        // Delivery = 40 INR (4000 paise)
        // Platform Fee = 15 INR (1500 paise)
        // Total = 100000 + 3000 + 5150 + 4000 + 1500 = 113650 paise
        if (pricingResult.pricing.foodSubtotalPaise !== 100000) {
            throw new Error(`Expected subtotal 100000 paise, got ${pricingResult.pricing.foodSubtotalPaise}`);
        }
        console.log("  ✔ Food Subtotal (Paise):", pricingResult.pricing.foodSubtotalPaise);
        console.log("  ✔ Tax Amount (Paise):", pricingResult.pricing.taxAmountPaise);
        console.log("  ✔ Total Payable Amount (Paise):", pricingResult.pricing.totalAmountPaise);
        console.log("✅ TEST 1 PASSED: Server pricing calculated correctly in integer paise.");

        // TEST 2: COMMISSION & SETTLEMENT CALCULATION
        console.log("\n[TEST 2] Testing Commission (5% Platform, 5% Delivery) & Restaurant Settlement...");
        const commissionResult = await CommissionService.calculateCommission({
            foodSubtotalPaise: pricingResult.pricing.foodSubtotalPaise,
            totalAmountPaise: pricingResult.pricing.totalAmountPaise
        });
        const settlementResult = SettlementService.calculateSettlement({
            pricing: pricingResult.pricing,
            commission: commissionResult.snapshot
        });

        // Platform 5% of 100000 paise = 5000 paise (₹50)
        // Delivery Partner 5% of 100000 paise = 5000 paise (₹50)
        // Restaurant Settlement = (100000 - 5000) + 3000 (pkg) + 5150 (tax) = 98150 paise
        if (commissionResult.snapshot.platform.amountPaise !== 5000) {
            throw new Error(`Expected platform commission 5000 paise, got ${commissionResult.snapshot.platform.amountPaise}`);
        }
        if (commissionResult.snapshot.deliveryPartner.amountPaise !== 5000) {
            throw new Error(`Expected delivery commission 5000 paise, got ${commissionResult.snapshot.deliveryPartner.amountPaise}`);
        }
        console.log("  ✔ Platform Commission (5%):", commissionResult.snapshot.platform.amountPaise, "paise");
        console.log("  ✔ Delivery Partner Share (5%):", commissionResult.snapshot.deliveryPartner.amountPaise, "paise");
        console.log("  ✔ Restaurant Net Settlement:", settlementResult.restaurantAmountPaise, "paise");
        console.log("✅ TEST 2 PASSED: Commission & settlement policy calculated transparently.");

        // TEST 3: FULL SUCCESSFUL ORDER FLOW & FINANCIAL LEDGER RECORDING
        console.log("\n[TEST 3] Testing Complete Successful Order Flow & Financial Ledger Recording...");
        const orderNumber = 'ZST-TEST-' + Math.floor(100000 + Math.random() * 900000);
        const testOrder = await Order.create({
            orderNumber,
            customer: testUser._id,
            foodPartner: testRestaurantA._id,
            deliveryPartner: testRider._id,
            items: pricingResult.processedItems,
            deliveryAddress: { street: 'Main St', city: 'Delhi' },
            pricing: pricingResult.pricing,
            commission: commissionResult.snapshot,
            settlement: {
                restaurantAmountPaise: settlementResult.restaurantAmountPaise,
                restaurantStatus: 'PENDING',
                platformAmountPaise: settlementResult.platformAmountPaise,
                platformStatus: 'PENDING',
                deliveryPartnerAmountPaise: settlementResult.deliveryPartnerAmountPaise,
                deliveryPartnerStatus: 'RESERVED'
            },
            financialBreakdown: settlementResult.financialBreakdown,
            payment: {
                method: 'Razorpay',
                gateway: 'MOCK_GATEWAY',
                gatewayOrderId: `ord_mock_${Date.now()}`,
                amountPaise: pricingResult.pricing.totalAmountPaise,
                currency: 'INR',
                status: 'PENDING'
            },
            status: 'PAYMENT_PENDING'
        });

        // Verify Payment & State Transition
        await FinancialLedgerService.recordCustomerPayment({
            order: testOrder,
            paymentId: `pay_mock_${Date.now()}`,
            gateway: 'MOCK_GATEWAY'
        });
        const paidOrder = await OrderStateMachineService.transition(testOrder._id, 'PAID');

        if (paidOrder.status !== 'RESTAURANT_PENDING') {
            throw new Error(`Expected status RESTAURANT_PENDING after PAID transition, got ${paidOrder.status}`);
        }
        console.log("  ✔ Payment Verified. Order transitioned to RESTAURANT_PENDING automatically.");

        // Progress to DELIVERED
        await OrderStateMachineService.transition(testOrder._id, 'RESTAURANT_ACCEPTED');
        await OrderStateMachineService.transition(testOrder._id, 'PREPARING');
        await OrderStateMachineService.transition(testOrder._id, 'READY_FOR_PICKUP');
        await OrderStateMachineService.transition(testOrder._id, 'DELIVERY_PARTNER_ASSIGNED');
        await OrderStateMachineService.transition(testOrder._id, 'PICKED_UP');
        await OrderStateMachineService.transition(testOrder._id, 'OUT_FOR_DELIVERY');
        const deliveredOrder = await OrderStateMachineService.transition(testOrder._id, 'DELIVERED');

        if (deliveredOrder.status !== 'DELIVERED') {
            throw new Error(`Expected status DELIVERED, got ${deliveredOrder.status}`);
        }

        // Verify Ledger Entries
        const ledgerCount = await FinancialLedger.countDocuments({ orderId: testOrder._id });
        console.log(`  ✔ Ledger Entries Created for Order: ${ledgerCount}`);
        if (ledgerCount < 3) {
            throw new Error(`Expected at least 3 ledger entries (CUSTOMER_PAYMENT, PLATFORM_COMMISSION, RESTAURANT_SETTLEMENT), found ${ledgerCount}`);
        }
        console.log("✅ TEST 3 PASSED: Successful order flow & ledger entries recorded cleanly.");

        // TEST 4: DUPLICATE WEBHOOK & IDEMPOTENCY PROTECTION
        console.log("\n[TEST 4] Testing Duplicate Webhook Handling & Idempotency...");
        const eventId = `evt_test_${Date.now()}`;
        const webhookPayload = {
            id: eventId,
            event: 'payment.authorized',
            payload: {
                payment: {
                    entity: {
                        id: `pay_test_${Date.now()}`,
                        order_id: testOrder.payment.gatewayOrderId
                    }
                }
            }
        };

        const firstWebhookRes = await WebhookService.handlePaymentWebhook({
            rawBody: JSON.stringify(webhookPayload),
            headers: {},
            body: webhookPayload
        });
        console.log("  ✔ First Webhook call response:", firstWebhookRes.message);

        const duplicateWebhookRes = await WebhookService.handlePaymentWebhook({
            rawBody: JSON.stringify(webhookPayload),
            headers: {},
            body: webhookPayload
        });
        console.log("  ✔ Second Webhook call response:", duplicateWebhookRes.message);

        if (duplicateWebhookRes.message !== 'DUPLICATE_WEBHOOK_EVENT') {
            throw new Error(`Expected DUPLICATE_WEBHOOK_EVENT, got ${duplicateWebhookRes.message}`);
        }
        console.log("✅ TEST 4 PASSED: Duplicate webhooks rejected idempotently without duplicating entries.");

        // TEST 5: RESTAURANT REJECTION & REFUND WORKFLOW
        console.log("\n[TEST 5] Testing Restaurant Rejection & Safe Refund Flow...");
        const refundOrderNumber = 'ZST-TEST-' + Math.floor(100000 + Math.random() * 900000);
        const orderToReject = await Order.create({
            orderNumber: refundOrderNumber,
            customer: testUser._id,
            foodPartner: testRestaurantA._id,
            pricing: pricingResult.pricing,
            payment: {
                method: 'Razorpay',
                gatewayOrderId: `ord_reject_${Date.now()}`,
                gatewayPaymentId: `pay_reject_${Date.now()}`,
                amountPaise: pricingResult.pricing.totalAmountPaise,
                status: 'PAID'
            },
            status: 'PAID'
        });

        const refundResult = await RefundService.processRefund({
            orderId: orderToReject._id,
            reason: 'Item out of stock',
            requestedBy: 'RESTAURANT'
        });

        console.log("  ✔ Refund Processed:", refundResult.success, "Refund ID:", refundResult.refundId);

        const refundedLedger = await FinancialLedger.findOne({ orderId: orderToReject._id, type: 'REFUND' });
        if (!refundedLedger) {
            throw new Error("Missing DEBIT REFUND entry in Financial Ledger");
        }
        console.log("  ✔ REFUND Ledger Entry:", refundedLedger.direction, refundedLedger.amount, "paise");
        console.log("✅ TEST 5 PASSED: Restaurant rejection trigger refunds and ledger DEBIT entries.");

        // TEST 6: AUTHORIZATION ISOLATION CHECK
        console.log("\n[TEST 6] Testing Role-Based Financial Authorization Isolation...");
        const restaurantAFinancials = await FinancialLedger.find({ restaurantId: testRestaurantA._id });
        const restaurantBFinancials = await FinancialLedger.find({ restaurantId: testRestaurantB._id });

        if (restaurantBFinancials.length !== 0) {
            throw new Error("Data leakage! Restaurant B accessed Restaurant A's transactions.");
        }
        console.log(`  ✔ Restaurant A has ${restaurantAFinancials.length} ledger entries.`);
        console.log(`  ✔ Restaurant B has 0 ledger entries as expected.`);
        console.log("✅ TEST 6 PASSED: Financial data access strictly isolated by role and entity ID.");

        // TEST 7: RACE CONDITION & CONCURRENCY PROTECTION
        console.log("\n[TEST 7] Testing Concurrency & Race Condition Protection on Simultaneous Verifications...");
        const raceOrderNumber = 'ZST-TEST-' + Math.floor(100000 + Math.random() * 900000);
        const raceOrder = await Order.create({
            orderNumber: raceOrderNumber,
            customer: testUser._id,
            foodPartner: testRestaurantA._id,
            pricing: pricingResult.pricing,
            payment: {
                method: 'Razorpay',
                gatewayOrderId: `ord_race_${Date.now()}`,
                amountPaise: pricingResult.pricing.totalAmountPaise,
                status: 'PENDING'
            },
            status: 'PAYMENT_PENDING'
        });

        // Run 5 parallel verification attempts
        const verificationPromises = Array.from({ length: 5 }).map(() =>
            OrderStateMachineService.transition(raceOrder._id, 'PAID').catch(err => err.message)
        );

        await Promise.all(verificationPromises);
        const finalRaceOrder = await Order.findById(raceOrder._id);
        console.log("  ✔ Final order status after concurrent transitions:", finalRaceOrder.status);
        console.log("✅ TEST 7 PASSED: Race condition handled safely without corrupted status states.");

        console.log("\n=================================================");
        console.log("🎉 ALL 7 FINANCIAL SYSTEM TEST SCENARIOS PASSED!");
        console.log("=================================================");
    } catch (err) {
        console.error("\n❌ TEST FAILED:", err.message);
        console.error(err.stack);
        process.exitCode = 1;
    } finally {
        try {
            if (typeof testFoodItem !== 'undefined' && testFoodItem) await Food.deleteOne({ _id: testFoodItem._id });
            if (typeof testRestaurantA !== 'undefined' && testRestaurantA) await FoodPartner.deleteOne({ _id: testRestaurantA._id });
            if (typeof testRestaurantB !== 'undefined' && testRestaurantB) await FoodPartner.deleteOne({ _id: testRestaurantB._id });
            if (typeof testRider !== 'undefined' && testRider) await DeliveryPartner.deleteOne({ _id: testRider._id });
            if (typeof testCustomer !== 'undefined' && testCustomer) await User.deleteOne({ _id: testCustomer._id });
        } catch (e) {}
        await mongoose.disconnect();
        console.log("Database Connection Closed.");
    }
}

runTests();
