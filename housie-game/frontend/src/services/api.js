import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://game-kuyp.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// 🔥 Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API ERROR:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;