// backend/src/routes/bookingRoutes.ts
import { Router } from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
  getOwnerBookings,
  getTenantBookings,
  approveBooking,
  disapproveBooking,
  cancelBooking,
  confirmPayment, // NEW: Import the new controller function
} from '../controllers/flatController'; // We'll keep these controller functions in flatController for now

const router = Router();

// Get all booking requests for flats owned by the user
router.get('/owner', protect, authorize('owner'), getOwnerBookings);

// Get all booking requests for a tenant
router.get('/tenant', protect, authorize('tenant'), getTenantBookings);

// Approve a specific booking request
router.put('/:id/approve', protect, authorize('owner'), approveBooking);

// Disapprove a specific booking request
router.put('/:id/disapprove', protect, authorize('owner'), disapproveBooking);

// Route for a tenant to cancel a booking
router.delete('/:id', protect, authorize('tenant'), cancelBooking);

// NEW: Route for a tenant to confirm a booking after payment
router.put('/:id/confirm-payment', protect, authorize('tenant'), confirmPayment);

export default router;