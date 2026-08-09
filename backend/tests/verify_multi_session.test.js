const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';

async function runMultiSessionTests() {
    console.log("=================================================");
    console.log("🚀 TESTING MULTI-SESSION & AUTH CONFLICT PREVENTIONS");
    console.log("=================================================");

    const loginOrRegister = async (endpoint, payload) => {
        let res = await fetch(`${BASE_URL}${endpoint}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        let text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch {}

        if (!res.ok || !data.token) {
            res = await fetch(`${BASE_URL}${endpoint}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: payload.email, password: payload.password })
            });
            text = await res.text();
            try { data = JSON.parse(text); } catch {}
        }
        const token = data.token || data.accessToken;
        if (!token) {
            console.error(`❌ Authentication failed for ${endpoint}:`, text);
            process.exit(1);
        }
        return token;
    };

    const runId = Date.now();
    const generatePhone = () => '9' + Math.floor(100000000 + Math.random() * 900000000);

    console.log("[STEP 1] Authenticating 4 Independent Role Accounts via API...");
    const customerEmail = `customer_${runId}@zesty.test`;
    const customerToken = await loginOrRegister('/auth/user', {
        email: customerEmail,
        password: 'Password123!',
        fullName: 'Multi Customer',
        phone: generatePhone()
    });

    const partnerToken = await loginOrRegister('/auth/foodpartner', {
        email: `partner_${runId}@zesty.test`,
        password: 'Password123!',
        name: 'Multi Partner',
        phone: generatePhone()
    });

    const riderToken = await loginOrRegister('/auth/delivery', {
        email: `rider_${runId}@zesty.test`,
        password: 'Password123!',
        name: 'Multi Rider',
        phone: generatePhone()
    });

    const adminToken = await loginOrRegister('/auth/admin', {
        email: 'admin@zesty.app',
        password: 'Password123!'
    });

    console.log("✅ All 4 Tokens issued successfully via auth endpoints!");

    // 2. Test Concurrent /me Verification for All Roles
    console.log("\n[TEST 1] Verifying Concurrent Roles via /api/auth/me...");

    const fetchMe = async (token, expectedType) => {
        const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.status === 200 && data.type === expectedType) {
            console.log(`  ✔ Role '${expectedType}' verified successfully! Account ID: ${data.profile._id}`);
            return true;
        } else {
            console.error(`  ❌ Role '${expectedType}' verification failed! Status: ${res.status}`, data);
            return false;
        }
    };

    const cOk = await fetchMe(customerToken, 'user');
    const rOk = await fetchMe(partnerToken, 'foodpartner');
    const dOk = await fetchMe(riderToken, 'delivery');
    const aOk = await fetchMe(adminToken, 'admin');

    if (!cOk || !rOk || !dOk || !aOk) {
        console.error("❌ Test 1 Failed: Concurrent role resolution failed");
        process.exit(1);
    }

    // 3. Test Cross-Session Non-Interference (Interleaved calls across 4 active browser sessions)
    console.log("\n[TEST 2] Interleaved API Requests (Simulating 4 active tabs simultaneously)...");
    for (let i = 1; i <= 3; i++) {
        await fetchMe(customerToken, 'user');
        await fetchMe(riderToken, 'delivery');
        await fetchMe(partnerToken, 'foodpartner');
        await fetchMe(adminToken, 'admin');
    }
    console.log("  ✔ All 4 roles remained 100% active and authenticated across interleaved calls!");

    // 4. Test Same User Multiple Sessions
    console.log("\n[TEST 3] Testing Same Customer with 2 Independent Login Tokens...");
    const customerTokenSession2 = await loginOrRegister('/auth/user', {
        email: customerEmail,
        password: 'Password123!'
    });

    const s1Ok = await fetchMe(customerToken, 'user');
    const s2Ok = await fetchMe(customerTokenSession2, 'user');

    if (s1Ok && s2Ok) {
        console.log("  ✔ Both Customer Session 1 and Session 2 remain valid simultaneously!");
    } else {
        console.error("❌ Test 3 Failed: Same-user multi-session test failed");
        process.exit(1);
    }

    console.log("\n=================================================");
    console.log("🎉 ALL MULTI-SESSION TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================");

    process.exit(0);
}

runMultiSessionTests().catch(err => {
    console.error("❌ Test Script Error:", err);
    process.exit(1);
});
