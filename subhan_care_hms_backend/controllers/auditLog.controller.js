const AuditLog = require('../models/AuditLog');

/**
 * Get all audit logs with optional filters, search, sorting, and pagination
 */
const getAuditLogs = async (req, res) => {
  try {
    const { search, action, entity, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (action) query.action = action;
    if (entity) query.affectedEntity = entity;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    let logs = await AuditLog.find(query)
      .populate('userId', 'fullName email role username')
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Optional text search in user info or details or entity
    if (search) {
      const q = search.toLowerCase().trim();
      logs = logs.filter((log) => {
        const userName = log.userId?.fullName?.toLowerCase() || '';
        const userEmail = log.userId?.email?.toLowerCase() || '';
        const actionStr = log.action?.toLowerCase() || '';
        const entityStr = log.affectedEntity?.toLowerCase() || '';
        const recordStr = String(log.affectedRecordId || '').toLowerCase();
        const detailsStr = JSON.stringify(log.details || {}).toLowerCase();

        return (
          userName.includes(q) ||
          userEmail.includes(q) ||
          actionStr.includes(q) ||
          entityStr.includes(q) ||
          recordStr.includes(q) ||
          detailsStr.includes(q)
        );
      });
    }

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAuditLogs
};
