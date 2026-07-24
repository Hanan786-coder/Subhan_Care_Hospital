import api from './api';

export const getDoctors = async () => {
  const response = await api.get('/doctors');
  return response.data;
};

export const getDoctorById = async (id) => {
  const response = await api.get(`/doctors/${id}`);
  return response.data;
};

export const createDoctor = async (doctorData) => {
  const response = await api.post('/doctors', doctorData);
  return response.data;
};

export const updateDoctor = async (id, doctorData) => {
  const response = await api.put(`/doctors/${id}`, doctorData);
  return response.data;
};

export const updateDoctorSchedule = async (id, schedule) => {
  const response = await api.put(`/doctors/${id}/schedule`, { schedule });
  return response.data;
};

export const deactivateDoctor = async (id) => {
  const response = await api.patch(`/doctors/${id}/deactivate`);
  return response.data;
};
