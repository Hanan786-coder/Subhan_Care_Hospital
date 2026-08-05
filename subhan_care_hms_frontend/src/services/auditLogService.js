import api from './api';

export const getAuditLogs = async (params = {}) => {
  const response = await api.get('/audit-logs', { params });
  return response.data;
};

export const getAuditLogStats = async () => {
  const response = await api.get('/audit-logs/stats');
  return response.data;
};
