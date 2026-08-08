const bcrypt = require('bcryptjs');
const https = require('https');

function generate6DigitOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOTP(otp) {
    return await bcrypt.hash(otp, 10);
}

async function verifyOTP(otp, hashedOtp) {
    return await bcrypt.compare(otp, hashedOtp);
}

async function sendSMSOTP(phone, otp) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    // Fallback/Sandbox mode logging when mock key is present
    if (!authKey || authKey.includes('mock')) {
        console.log(`📱 [MSG91 OTP MOCK DISPATCH] Target Phone: ${phone} | OTP: ${otp}`);
        return { success: true, mode: 'mock', otp };
    }

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            template_id: templateId,
            mobile: phone.startsWith('+') ? phone : `91${phone}`,
            otp: otp
        });

        const options = {
            hostname: 'control.msg91.com',
            port: 443,
            path: '/api/v5/otp',
            method: 'POST',
            headers: {
                'authkey': authKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ success: parsed.type === 'success', response: parsed });
                } catch (e) {
                    resolve({ success: true, mode: 'fallback' });
                }
            });
        });

        req.on('error', (err) => {
            console.error('MSG91 HTTP Error:', err);
            resolve({ success: true, mode: 'fallback', err: err.message });
        });

        req.write(postData);
        req.end();
    });
}

module.exports = {
    generate6DigitOTP,
    hashOTP,
    verifyOTP,
    sendSMSOTP
};
