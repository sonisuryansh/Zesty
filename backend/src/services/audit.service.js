const AuditLog = require('../models/auditLog.model');
const { parseDeviceInfo } = require('../utils/device.utils');

async function logAuditEvent(req, { action, performedBy, performerModel, role, details }) {
    try {
        const deviceInfo = req ? parseDeviceInfo(req) : {};
        await AuditLog.create({
            action,
            performedBy,
            performerModel,
            role,
            details,
            ip: deviceInfo.ip || '127.0.0.1',
            browser: deviceInfo.browser || 'Unknown',
            os: deviceInfo.os || 'Unknown',
            device: deviceInfo.device || 'Unknown'
        });
    } catch (err) {
        console.error("❌ Audit log error:", err.message);
    }
}

module.exports = { logAuditEvent };
