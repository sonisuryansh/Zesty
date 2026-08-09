const useragent = require('express-useragent');

function parseDeviceInfo(req) {
    try {
        const source = req?.headers?.['user-agent'] || req?.headers?.['useragent'] || '';
        const agentInstance = useragent.UserAgent ? new useragent.UserAgent() : null;
        
        let ua = {};
        if (agentInstance && typeof agentInstance.parse === 'function' && source) {
            ua = agentInstance.parse(source);
        } else if (typeof useragent.parse === 'function' && source) {
            ua = useragent.parse(source);
        }

        const rawIp = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
        const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();

        return {
            browser: ua.browser || 'Unknown',
            os: ua.os || 'Unknown',
            device: ua.isMobile ? 'Mobile' : ua.isTablet ? 'Tablet' : ua.isDesktop ? 'Desktop' : 'Unknown',
            ip: ip || '127.0.0.1',
            userAgent: source || ''
        };
    } catch (err) {
        console.error("❌ Device parsing error:", err.message);
        return {
            browser: 'Unknown',
            os: 'Unknown',
            device: 'Unknown',
            ip: '127.0.0.1',
            userAgent: req?.headers?.['user-agent'] || ''
        };
    }
}

module.exports = { parseDeviceInfo };
