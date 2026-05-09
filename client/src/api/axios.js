import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});
// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('tt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If token expired, logout automatically
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tt_token');
      localStorage.removeItem('tt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;