import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // La URL del backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Antes de cada petición, busca el token y lo añade
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});