import api from './api';

/**
 * Log in a user with credentials.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} The response data containing token and user info.
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

/**
 * Get the currently authenticated user's details from backend.
 * @returns {Promise<Object>}
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyOtp = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put('/auth/change-password', data);
  return response.data;
};

export const verifyPasswordChangeOtp = async (data) => {
  const response = await api.post('/auth/verify-password-change', data);
  return response.data;
};

export const confirmPasswordChange = async (data) => {
  const response = await api.put('/auth/confirm-password-change', data);
  return response.data;
};
