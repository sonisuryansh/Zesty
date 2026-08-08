const useragent = require('express-useragent');

function parseDeviceInfo(req) {
    const source = req.headers['user-agent'] || '';
    const ua = useragent.parse(source);
    
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    return {
        browser: ua.browser || 'Unknown Browser',
        os: ua.os || 'Unknown OS',
        device: ua.isMobile ? 'Mobile' : ua.isTablet ? 'Tablet' : ua.isDesktop ? 'Desktop' : 'Unknown Device',
        ip: Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim(),
        userAgent: source
    };
}

module.exports = { parseDeviceInfo };
