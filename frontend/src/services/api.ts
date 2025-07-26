// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Accessing Vite env variables

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set the Authorization header for authenticated requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- Authentication API Calls ---
export const register = (userData: any) => api.post('/auth/register', userData);
export const login = (credentials: any) => api.post('/auth/login', credentials);

// --- Flat API Calls ---
export const getAllFlats = () => api.get('/flats');
export const createFlat = (flatData: any) => api.post('/flats', flatData);
export const getOwnerFlats = () => api.get('/flats/owner');
export const getFlatById = (id: number) => api.get(`/flats/${id}`);
export const deleteFlat = (id: number) => api.delete(`/flats/${id}`);
export const updateFlat = (id: number, flatData: any) => api.put(`/flats/${id}`, flatData);
