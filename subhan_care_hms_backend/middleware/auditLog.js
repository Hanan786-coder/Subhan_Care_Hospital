/**
 * Audit Logging Middleware & Utility
 * Automatically and manually records data-altering actions for transparency.
 */
const AuditLog = require('../models/AuditLog');

const getClientIp = (req) => {
  if (!req) return '127.0.0.1';
  let ip = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || req.ip || req.connection?.remoteAddress || '127.0.0.1';
  if (typeof ip === 'string') {
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
  }
  return ip || '127.0.0.1';
};

const logAuditEvent = async (req, action, entity, recordId, details = {}) => {
  try {
    if (req && req.user) {
      await AuditLog.create({
        userId: req.user._id,
        action,
        affectedEntity: entity,
        affectedRecordId: recordId ? String(recordId) : 'N/A',
        details,
        ipAddress: getClientIp(req)
      });
    }
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

const auditLogger = (entity) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let action = 'UNKNOWN';
        if (req.method === 'POST') action = 'CREATE';
        else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
        else if (req.method === 'DELETE') action = 'DELETE';

        if (action !== 'UNKNOWN' && req.user) {
          try {
            await AuditLog.create({
              userId: req.user._id,
              action: action,
              affectedEntity: entity,
              ipAddress: getClientIp(req),
              affectedRecordId: req.params.id || 'new_record',
              details: { url: req.originalUrl, method: req.method }
            });
          } catch (error) {
            console.error('Audit logging failed:', error);
          }
        }
      }
    });
    next();
  };
};

module.exports = { auditLogger, logAuditEvent };
