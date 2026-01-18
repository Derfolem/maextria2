import axios from 'axios';

const isBrowser = typeof window !== 'undefined';
const fallbackApiUrl = isBrowser && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://maextria2-production.up.railway.app/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

const resolveAuthStorage = () => {
  if (!isBrowser) {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  const remember = window.localStorage.getItem('maextria_remember_me');
  const useLocal = remember === null || remember === '1';
  return useLocal ? window.localStorage : window.sessionStorage;
};

api.interceptors.request.use((config) => {
  const token = resolveAuthStorage().getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (isBrowser) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        window.sessionStorage.removeItem('token');
        window.sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
