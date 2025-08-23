// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD
  ? window.location.origin + '/api'
  : import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Interceptor: 401 Unauthorized received. Propagating error.");
    }
    return Promise.reject(error);
  }
);

// --- Authentication API Calls ---
export const register = (userData: any) => api.post('/auth/register', userData);
export const login = (credentials: any) => api.post('/auth/login', credentials);
export const verifyEmail = (email: string, code: string, verificationToken: string) => api.post('/auth/verify-email', { email, code, verificationToken });
export const resendVerificationCode = (email: string) => api.post('/auth/resend-verification', { email });

// Password Reset API calls
export const forgotPassword = (email: string) => api.post('/auth/forgot-password', { email }); // Sends a code
export const verifyPasswordResetCode = (token: string, code: string) => api.post('/auth/verify-password-reset-code', { token, code }); // Verifies the code
export const setNewPassword = (token: string, newPassword: string) => api.post('/auth/set-new-password', { token, newPassword }); // Sets the new password

// --- Flat API Calls ---
export const getAllFlats = (
  sortBy?: string,
  sortOrder?: string,
  amenityIds: number[] = [],
  district?: string,
  minRent?: number,
  maxRent?: number
) => {
  const params = new URLSearchParams();

  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (district) params.append('district', district);
  if (minRent) params.append('minRent', String(minRent));
  if (maxRent) params.append('maxRent', String(maxRent));

  amenityIds.forEach(id => {
    params.append('amenities', String(id));
  });

  return api.get(`/flats?${params.toString()}`);
};


export const getAllAmenities = () => api.get('/flats/amenities');
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
export const cancelBooking = (bookingId: number) => api.delete(`/bookings/${bookingId}`);