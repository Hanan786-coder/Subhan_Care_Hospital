import api from './api';

export const getMedicalHistory = async (params = {}) => {
  const response = await api.get('/medical-history', { params });
  return response.data;
};

export const correctHistoryEntry = async (id, payload) => {
  const response = await api.put(`/medical-history/${id}/correct`, payload);
  return response.data;
};
