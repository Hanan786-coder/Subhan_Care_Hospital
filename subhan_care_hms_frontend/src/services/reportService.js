import api from './api';

export const getSummaryReport = async (range = 'all') => {
  const response = await api.get('/reports/summary', { params: { range } });
  return response.data;
};

export const getRevenueReport = async (range = 'all') => {
  const response = await api.get('/reports/revenue', { params: { range } });
  return response.data;
};

export const getPatientReport = async () => {
  const response = await api.get('/reports/patients');
  return response.data;
};

export const getAppointmentReport = async (range = 'all') => {
  const response = await api.get('/reports/appointments', { params: { range } });
  return response.data;
};

export const getInventoryReport = async () => {
  const response = await api.get('/reports/inventory');
  return response.data;
};
