// Cliente HTTP hacia la API CI4. Adjunta el Firebase ID token en cada petición.
// El SDK de Firebase refresca el token solo; aquí solo lo leemos antes de cada request.
import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(); // refresco transparente
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    // 401 → el SPA debe redirigir a login (Firebase). La autoridad es la API.
    return Promise.reject(error);
  },
);
