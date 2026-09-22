import axios from 'axios';

const apiBaseUrl = ((import.meta as any).env?.VITE_API_URL as string) || '/api/v1';

export const api = axios.create({
  baseURL: apiBaseUrl,
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
