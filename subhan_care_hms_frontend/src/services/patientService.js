import api from './api';

export const getPatients = async (search = '') => {
  const response = await api.get(`/patients?search=${search}`);
  return response.data;
};

export const getPatientById = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

export const registerPatient = async (patientData) => {
  const response = await api.post('/patients', patientData);
  return response.data;
};

export const updatePatient = async (id, patientData) => {
  const response = await api.put(`/patients/${id}`, patientData);
  return response.data;
};

export const deactivatePatient = async (id) => {
  const response = await api.patch(`/patients/${id}/deactivate`);
  return response.data;
};
