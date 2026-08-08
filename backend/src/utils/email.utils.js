const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, html, text }) {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || user.includes('mock') || !pass || pass.includes('mock')) {
        console.log(`📧 [EMAIL MOCK DISPATCH] To: ${to} | Subject: ${subject}`);
        console.log(`Content:\n${text || html}`);
        return { success: true, mode: 'mock' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass }
        });

        const info = await transporter.sendMail({
            from: `"Zesty Security" <${user}>`,
            to,
            subject,
            text,
            html
        });

        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error('Nodemailer error:', err);
        console.log(`📧 [EMAIL MOCK FALLBACK] To: ${to} | Subject: ${subject}`);
        return { success: true, mode: 'fallback', error: err.message };
    }
}

module.exports = { sendEmail };
