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
    required: true // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
  },
  affectedEntity: {
    type: String,
    required: true // e.g., 'Patient', 'Doctor'
  },
  affectedRecordId: {
    type: String
  },
  details: {
    type: Object // Snapshot of before/after changes
  },
  ipAddress: {
    type: String
  }
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } }); // Immutable, no updates

module.exports = mongoose.model('AuditLog', auditLogSchema);
