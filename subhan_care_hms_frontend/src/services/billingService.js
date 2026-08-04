import api from './api';

export const getInvoices = async (params = {}) => {
  const response = await api.get('/billing', { params });
  return response.data;
};

export const createInvoice = async (payload) => {
  const response = await api.post('/billing', payload);
  return response.data;
};

export const recordPayment = async (id, payload) => {
  const response = await api.put(`/billing/${id}/payment`, payload);
  return response.data;
};
