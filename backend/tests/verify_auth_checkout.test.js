require('dotenv').config();
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const connectDB = require('../src/db/db');
const User = require('../src/models/user.model');
const FoodPartner = require('../src/models/foodpartner.model');
const Food = require('../src/models/food.model');
const Cart = require('../src/models/cart.model');
const Address = require('../src/models/address.model');
const jwt = require('jsonwebtoken');
const securityConfig = require('../src/config/security.config');

async function testAuthCheckout() {
    console.log("=================================================");
    console.log("🚀 TESTING AUTHENTICATION & CHECKOUT FLOW");
    console.log("=================================================");

    await connectDB();

    try {
        // Cleanup test user
        await User.deleteMany({ email: 'auth_checkout_test@zesty.com' });
        await FoodPartner.deleteMany({ email: 'auth_checkout_partner@zesty.com' });
        await Food.deleteMany({ name: 'Chocolate Cake' });

        const testUser = await User.create({
            fullName: 'Checkout Auth User',
            email: 'auth_checkout_test@zesty.com',
            password: 'password123',
            phone: '9991112223'
        });

        const testPartner = await FoodPartner.create({
            name: 'Auth Test Bakery',
            email: 'auth_checkout_partner@zesty.com',
            password: 'password123',
            isOnline: true,
            approvalStatus: 'approved'
        });

        const testFood = await Food.create({
            name: 'Chocolate Cake',
            foodPartner: testPartner._id,
            price: 500,
            isAvailable: true
        });

        // Generate valid JWT token
        const token = jwt.sign({ id: testUser._id, role: 'user' }, securityConfig.JWT.ACCESS_SECRET, { expiresIn: '1h' });
        console.log("✅ Generated Test User JWT Token:", token.slice(0, 25) + '...');

        // 1. Create Address for User
        const testAddress = await Address.create({
            user: testUser._id,
            label: 'Home',
            fullName: 'Checkout Auth User',
            phone: '9991112223',
            houseNumber: '12',
            street: '123 Test Street',
            area: 'Central',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
        });
        console.log("✅ User Address Created:", testAddress._id);

        // 2. Create Cart for User
        await Cart.create({
            user: testUser._id,
            foodPartner: testPartner._id,
            items: [{ food: testFood._id, name: 'Chocolate Cake', quantity: 2, price: 500 }],
            subtotal: 1000
        });
        console.log("✅ User Cart Created");

        // 3. Test HTTP fetch to /api/address with Authorization header
        const http = require('http');
        
        function makeRequest(path, method = 'GET', body = null) {
            return new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: '127.0.0.1',
                    port: 3000,
                    path: `/api${path}`,
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve({ status: res.statusCode, data: JSON.parse(data) });
                        } catch (e) {
                            resolve({ status: res.statusCode, data });
                        }
                    });
                });
                req.on('error', reject);
                if (body) req.write(JSON.stringify(body));
                req.end();
            });
        }

        console.log("\n[STEP 1] Fetching User Addresses via /api/address...");
        const addressRes = await makeRequest('/address');
        console.log("  Status:", addressRes.status);
        console.log("  Response:", addressRes.data);

        if (addressRes.status !== 200) {
            throw new Error(`Expected /api/address status 200, got ${addressRes.status}`);
        }
        console.log("  ✔ /api/address request succeeded with Bearer token!");

        console.log("\n[STEP 2] Placing Order via /api/payments/create-order...");
        const paymentOrderRes = await makeRequest('/payments/create-order', 'POST', {
            deliveryAddress: { street: '123 Test Street', city: 'Delhi' },
            paymentMethod: 'Razorpay'
        });
        console.log("  Status:", paymentOrderRes.status);
        console.log("  Response:", paymentOrderRes.data);

        if (paymentOrderRes.status !== 201) {
            throw new Error(`Expected /api/payments/create-order status 201, got ${paymentOrderRes.status}`);
        }
        console.log("  ✔ /api/payments/create-order succeeded with Bearer token!");

        console.log("\n[STEP 3] Placing Order via /api/orders/checkout...");
        // Re-add cart for checkout test
        await Cart.findOneAndUpdate(
            { user: testUser._id },
            {
                user: testUser._id,
                foodPartner: testPartner._id,
                items: [{ food: testFood._id, name: 'Chocolate Cake', quantity: 1, price: 500 }],
                subtotal: 500
            },
            { upsert: true, new: true }
        );

        const checkoutRes = await makeRequest('/orders/checkout', 'POST', {
            deliveryAddress: { street: '123 Test Street', city: 'Delhi' },
            paymentMethod: 'COD'
        });
        console.log("  Status:", checkoutRes.status);
        console.log("  Response:", checkoutRes.data.message);

        if (checkoutRes.status !== 201) {
            throw new Error(`Expected /api/orders/checkout status 201, got ${checkoutRes.status}`);
        }
        console.log("  ✔ /api/orders/checkout succeeded with Bearer token!");

        console.log("\n=================================================");
        console.log("🎉 ALL AUTHENTICATION & CHECKOUT VERIFICATIONS PASSED!");
        console.log("=================================================");
    } catch (err) {
        console.error("\n❌ VERIFICATION FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        try {
            if (typeof testFood !== 'undefined' && testFood) await Food.deleteOne({ _id: testFood._id });
            if (typeof testPartner !== 'undefined' && testPartner) await FoodPartner.deleteOne({ _id: testPartner._id });
            if (typeof testUser !== 'undefined' && testUser) await User.deleteOne({ _id: testUser._id });
            if (typeof testAddress !== 'undefined' && testAddress) await Address.deleteOne({ _id: testAddress._id });
        } catch (cleanupErr) {}
        const mongoose = require('mongoose');
        await mongoose.disconnect();
    }
}

testAuthCheckout();
