import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected network error occurred.',
    };
    return Promise.reject(errorData);
  }
);
