// backend/src/routes/bookingRoutes.ts
import { Router } from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
  getOwnerBookings,
  getTenantBookings,
  approveBooking,
  disapproveBooking,
  cancelBooking,
  confirmPayment, // Existing, but now part of the new flow
  requestExtension, // NEW
  approveExtension, // NEW
  rejectExtension,  // NEW
  confirmExtensionPayment, // NEW
} from '../controllers/flatController'; // All these controller functions are in flatController

const router = Router();

// Get all booking requests for flats owned by the user
router.get('/owner', protect, authorize('owner'), getOwnerBookings);

// Get all booking requests for a tenant
router.get('/tenant', protect, authorize('tenant'), getTenantBookings);

// Approve a specific booking request (Owner action)
router.put('/:id/approve', protect, authorize('owner'), approveBooking);

// Disapprove a specific booking request (Owner action)
router.put('/:id/disapprove', protect, authorize('owner'), disapproveBooking);

// Route for a tenant to cancel a booking
router.delete('/:id', protect, authorize('tenant'), cancelBooking);

// NEW: Route for a tenant to confirm a booking after payment
router.put('/:id/confirm-payment', protect, authorize('tenant'), confirmPayment);

// NEW: Route for a tenant to request an extension
router.post('/:id/extensions', protect, authorize('tenant'), requestExtension);

// NEW: Route for an owner to approve an extension
router.put('/extensions/:id/approve', protect, authorize('owner'), approveExtension);

// NEW: Route for an owner to reject an extension
router.put('/extensions/:id/reject', protect, authorize('owner'), rejectExtension);

// NEW: Route for a tenant to confirm payment for an extension
router.put('/extensions/:id/confirm-payment', protect, authorize('tenant'), confirmExtensionPayment);


export default router;