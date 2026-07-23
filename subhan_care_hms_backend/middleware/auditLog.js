/**
 * Audit Logging Middleware
 * Automatically logs data-altering requests.
 */
const AuditLog = require('../models/AuditLog');

const auditLogger = (entity) => {
  return async (req, res, next) => {
    // We only log after the request has finished successfully
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
              ipAddress: req.ip,
              // Record ID usually in params.id or in response body (would need to intercept response for created ID)
              affectedRecordId: req.params.id || 'new_record' 
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

module.exports = { auditLogger };
