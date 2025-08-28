// frontend/src/services/api.ts
import axios, { AxiosResponse } from 'axios';

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
  (response: AxiosResponse) => {
    // ALWAYS return the full response object for consistency.
    // Components will now be responsible for accessing `response.data`.
    return response;
  },
  (error) => {
    // Extract a user-friendly error message from the backend's structured error response.
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    
    // Create a new error object with the custom message and attach the original response
    const customError: any = new Error(errorMessage);
    customError.response = error.response;
    
    return Promise.reject(customError);
  }
);


// --- Authentication API Calls ---
export const register = (userData: any) => api.post('/auth/register', userData);
export const login = (credentials: any) => api.post('/auth/login', credentials);
export const verifyEmail = (email: string, code: string, verificationToken: string) => api.post('/auth/verify-email', { email, code, verificationToken });
export const resendVerificationCode = (email: string) => api.post('/auth/resend-verification', { email });

// Password Reset API calls
export const forgotPassword = (email: string) => api.post('/auth/forgot-password', { email });
export const verifyPasswordResetCode = (token: string, code: string) => api.post('/auth/verify-password-reset-code', { token, code });
export const setNewPassword = (token: string, newPassword: string) => api.post('/auth/set-new-password', { token, newPassword });

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
export const createFlat = (flatData: FormData) => {
  return api.post('/flats', flatData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getOwnerFlats = () => api.get('/flats/owner');
export const getFlatById = (id: number) => api.get(`/flats/${id}`);
export const deleteFlat = (id: number) => api.delete(`/flats/${id}`);
export const updateFlat = (id: number, flatData: FormData) => {
  return api.put(`/flats/${id}`, flatData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// --- Booking API Calls ---
export const createBooking = (flatId: number, bookingData: { startDate: Date; endDate: Date }) => api.post(`/flats/${flatId}/book`, bookingData);
export const getOwnerBookings = () => api.get('/bookings/owner');
export const getTenantBookings = () => api.get('/bookings/tenant');
export const approveBooking = (bookingId: number) => api.put(`/bookings/${bookingId}/approve`);
export const disapproveBooking = (bookingId: number) => api.put(`/bookings/${bookingId}/disapprove`);
export const cancelBooking = (bookingId: number) => api.delete(`/bookings/${bookingId}`);
export const confirmPayment = (bookingId: number) => api.put(`/bookings/${bookingId}/confirm-payment`);

// Extension API Calls
export const requestExtension = (bookingId: number, newEndDate: Date) => api.post(`/bookings/${bookingId}/extensions`, { newEndDate });
export const approveExtension = (extensionId: number) => api.put(`/bookings/extensions/${extensionId}/approve`);
export const rejectExtension = (extensionId: number) => api.put(`/bookings/extensions/${extensionId}/reject`);
export const confirmExtensionPayment = (extensionId: number) => api.put(`/bookings/extensions/${extensionId}/confirm-payment`);

// --- Review API Calls ---
export const getReviewsForFlat = (flatId: number) => api.get(`/reviews/${flatId}`);
export const upsertReview = (reviewData: any) => api.post(`/reviews`, reviewData);

// Function to update a flat's availability status
export const updateFlatStatus = (id: number, status: 'available' | 'unavailable') => api.put(`/flats/${id}/status`, { status });