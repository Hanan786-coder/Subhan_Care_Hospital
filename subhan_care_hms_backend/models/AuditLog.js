/**
 * AuditLog Model
 * Immutable audit trail for all data-altering actions.
 */
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'RESTOCK'
  },
  affectedEntity: {
    type: String
  },
  entity: {
    type: String
  },
  affectedRecordId: {
    type: String
  },
  recordId: {
    type: String
  },
  details: {
    type: Object
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

module.exports = mongoose.model('AuditLog', auditLogSchema);
