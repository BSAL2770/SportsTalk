import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Bubble a normalized message for UI consumers.
    const message =
      err.response?.data?.error ||
      err.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
