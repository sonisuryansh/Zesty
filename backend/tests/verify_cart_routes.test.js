require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const connectDB = require('../src/db/db');
const User = require('../src/models/user.model');
const FoodPartner = require('../src/models/foodpartner.model');
const Food = require('../src/models/food.model');
const jwt = require('jsonwebtoken');
const securityConfig = require('../src/config/security.config');
const app = require('../src/app');
const http = require('http');

async function testCartRoutes() {
    console.log("=================================================");
    console.log("🚀 TESTING CART API ROUTES (/add, /update, /remove)");
    console.log("=================================================");

    await connectDB();

    const server = app.listen(0);
    const port = server.address().port;
    console.log(`✅ Test server running on port ${port}`);

    try {
        await User.deleteMany({ email: 'cart_test_user@zesty.com' });
        await FoodPartner.deleteMany({ email: 'cart_test_partner@zesty.com' });
        await Food.deleteMany({ name: 'Pepperoni Pizza' });

        const testUser = await User.create({
            fullName: 'Cart Test User',
            email: 'cart_test_user@zesty.com',
            password: 'password123',
            phone: '9888877771'
        });

        const testPartner = await FoodPartner.create({
            name: 'Pizza Express',
            email: 'cart_test_partner@zesty.com',
            password: 'password123',
            isOnline: true,
            approvalStatus: 'approved'
        });

        const testFood = await Food.create({
            name: 'Pepperoni Pizza',
            foodPartner: testPartner._id,
            price: 399,
            isAvailable: true
        });

        const token = jwt.sign({ id: testUser._id, role: 'user' }, securityConfig.JWT.ACCESS_SECRET, { expiresIn: '1h' });

        function makeRequest(path, method = 'GET', body = null) {
            return new Promise((resolve, reject) => {
                const postData = body ? JSON.stringify(body) : '';
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                };
                if (postData) {
                    headers['Content-Length'] = Buffer.byteLength(postData);
                }

                const req = http.request({
                    hostname: '127.0.0.1',
                    port,
                    path: `/api${path}`,
                    method,
                    headers
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
                if (postData) req.write(postData);
                req.end();
            });
        }

        // 1. Add to Cart
        console.log("\n[STEP 1] Testing POST /api/cart/add...");
        const addRes = await makeRequest('/cart/add', 'POST', { foodId: testFood._id.toString(), quantity: 1 });
        console.log("  Status:", addRes.status);
        console.log("  Cart Items Count:", addRes.data.cart?.items?.length);
        if (addRes.status !== 200) throw new Error(`POST /cart/add failed with ${addRes.status}`);
        console.log("  ✔ POST /api/cart/add succeeded!");

        // 2. Update Quantity
        console.log("\n[STEP 2] Testing PUT /api/cart/update...");
        const updateRes = await makeRequest('/cart/update', 'PUT', { foodId: testFood._id.toString(), quantity: 3 });
        console.log("  Status:", updateRes.status);
        console.log("  Updated Item Quantity:", updateRes.data.cart?.items?.[0]?.quantity);
        if (updateRes.status !== 200 || updateRes.data.cart?.items?.[0]?.quantity !== 3) {
            throw new Error(`PUT /cart/update failed with ${updateRes.status}`);
        }
        console.log("  ✔ PUT /api/cart/update succeeded!");

        // 3. Remove Item
        console.log("\n[STEP 3] Testing DELETE /api/cart/remove...");
        const removeRes = await makeRequest('/cart/remove', 'DELETE', { foodId: testFood._id.toString() });
        console.log("  Status:", removeRes.status);
        console.log("  Cart Items Remaining:", removeRes.data.cart?.items?.length);
        if (removeRes.status !== 200 || removeRes.data.cart?.items?.length !== 0) {
            throw new Error(`DELETE /cart/remove failed with ${removeRes.status}`);
        }
        console.log("  ✔ DELETE /api/cart/remove succeeded!");

        console.log("\n=================================================");
        console.log("🎉 ALL CART ROUTE VERIFICATIONS PASSED!");
        console.log("=================================================");
    } catch (err) {
        console.error("\n❌ CART VERIFICATION FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        try {
            if (typeof testFood !== 'undefined' && testFood) await Food.deleteOne({ _id: testFood._id });
            if (typeof testPartner !== 'undefined' && testPartner) await FoodPartner.deleteOne({ _id: testPartner._id });
            if (typeof testUser !== 'undefined' && testUser) await User.deleteOne({ _id: testUser._id });
        } catch (cleanupErr) {}
        if (server) server.close();
        const mongoose = require('mongoose');
        await mongoose.disconnect();
    }
}

testCartRoutes();
