import api from './api';

export const getAppointments = async (params = {}) => {
  const response = await api.get('/appointments', { params });
  return response.data;
};

export const bookAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

export const rescheduleAppointment = async (id, payload) => {
  const response = await api.put(`/appointments/${id}/reschedule`, payload);
  return response.data;
};

export const completeAppointment = async (id, payload) => {
  const response = await api.put(`/appointments/${id}/complete`, payload);
  return response.data;
};

export const cancelAppointment = async (id, payload) => {
  const response = await api.put(`/appointments/${id}/cancel`, payload);
  return response.data;
};

export const getAvailableAppointmentSlots = async (params = {}) => {
  const response = await api.get('/appointments/available-slots', { params });
  return response.data;
};
