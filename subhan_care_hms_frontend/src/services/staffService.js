import api from './api';

export const getStaffList = async () => {
  const response = await api.get('/staff');
  return response.data;
};

export const getStaffById = async (id) => {
  const response = await api.get(`/staff/${id}`);
  return response.data;
};

export const createStaff = async (staffData) => {
  const response = await api.post('/staff', staffData);
  return response.data;
};

export const updateStaff = async (id, staffData) => {
  const response = await api.put(`/staff/${id}`, staffData);
  return response.data;
};

export const deactivateStaff = async (id) => {
  const response = await api.patch(`/staff/${id}/deactivate`);
  return response.data;
};
