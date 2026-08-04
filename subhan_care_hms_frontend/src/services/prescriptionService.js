import api from './api';

export const getPrescriptions = async (params = {}) => {
  const response = await api.get('/prescriptions', { params });
  return response.data;
};

export const createPrescription = async (payload) => {
  const response = await api.post('/prescriptions', payload);
  return response.data;
};

export const dispensePrescription = async (id, payload) => {
  const response = await api.put(`/prescriptions/${id}/dispense`, payload);
  return response.data;
};
