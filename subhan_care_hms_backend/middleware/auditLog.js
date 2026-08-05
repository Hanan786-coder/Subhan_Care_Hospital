/**
 * Audit Logging Middleware & Utility
 * Automatically and manually records data-altering actions for transparency.
 */
const AuditLog = require('../models/AuditLog');

const logAuditEvent = async (req, action, entity, recordId, details = {}) => {
  try {
    if (req && req.user) {
      await AuditLog.create({
        userId: req.user._id,
        action,
        affectedEntity: entity,
        affectedRecordId: recordId ? String(recordId) : 'N/A',
        details,
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1'
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
              ipAddress: req.ip || '127.0.0.1',
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
