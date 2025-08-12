// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD
  ? window.location.origin + '/api'
  : import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
export const getAllAmenities = () => api.get('/flats/amenities');
export const getAllFlats = () => api.get('/flats');
export const createFlat = (flatData: any) => api.post('/flats', flatData);
export const getOwnerFlats = () => api.get('/flats/owner');
export const getFlatById = (id: number) => api.get(`/flats/${id}`);
export const deleteFlat = (id: number) => api.delete(`/flats/${id}`);
export const updateFlat = (id: number, flatData: any) => api.put(`/flats/${id}`, flatData);

// --- Booking API Calls ---
export const createBooking = (flatId: number, bookingData: { startDate: Date; endDate: Date }) => api.post(`/flats/${flatId}/book`, bookingData);
export const getOwnerBookings = () => api.get('/bookings/owner');
export const getTenantBookings = () => api.get('/bookings/tenant');
export const approveBooking = (bookingId: number) => api.put(`/bookings/${bookingId}/approve`);
export const disapproveBooking = (bookingId: number) => api.put(`/bookings/${bookingId}/disapprove`);