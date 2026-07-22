import axios from 'axios';

/**
 * Axios instance configured for the API.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
});

/**
 * Request interceptor to attach Authorization token.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sc_hms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor to handle 401 Unauthorized errors.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sc_hms_token');
      localStorage.removeItem('sc_hms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
