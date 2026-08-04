import api from './api';

export const getInventory = async (params = {}) => {
  const response = await api.get('/inventory', { params });
  return response.data;
};

export const getSuppliers = async () => {
  const response = await api.get('/inventory/suppliers');
  return response.data;
};

export const createInventoryItem = async (payload) => {
  const response = await api.post('/inventory', payload);
  return response.data;
};

export const updateInventoryItem = async (id, payload) => {
  const response = await api.put(`/inventory/${id}`, payload);
  return response.data;
};

export const createSupplier = async (payload) => {
  const response = await api.post('/inventory/suppliers', payload);
  return response.data;
};
