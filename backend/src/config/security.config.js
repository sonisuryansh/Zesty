require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    ALLOWED_ORIGINS: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
    ],
    JWT: {
        ACCESS_SECRET: process.env.JWT_SECRET || 'zesty_super_secret_jwt_key_2026',
        REFRESH_SECRET: process.env.REFRESH_TOKEN_SECRET || 'zesty_super_secret_refresh_key_2026',
        ACCESS_EXPIRY: '15m',
        REFRESH_EXPIRY: '30d'
    },
    COOKIES: {
        ACCESS_COOKIE_NAME: 'token',
        REFRESH_COOKIE_NAME: 'refreshToken',
        OPTIONS: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000 // 15 mins
        },
        REFRESH_OPTIONS: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        }
    },
    ACCOUNT_SECURITY: {
        MAX_FAILED_LOGIN_ATTEMPTS: 5,
        LOCK_TIME_MS: 30 * 60 * 1000, // 30 mins
        OTP_EXPIRY_MINUTES: 5,
        OTP_COOLDOWN_SECONDS: 60,
        MAX_OTP_ATTEMPTS: 5
    }
};
