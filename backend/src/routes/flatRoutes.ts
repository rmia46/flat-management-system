// backend/src/routes/flatRoutes.ts
import { Router } from 'express';
import {
  createFlat, getAllFlats, getOwnerFlats, getFlatById, deleteFlat, updateFlat, getAllAmenities,
  createBooking,
  getOwnerBookings,
  getTenantBookings,
  approveBooking,
  disapproveBooking,
} from '../controllers/flatController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// --- Flat & Amenity Routes ---
router.get('/', getAllFlats);
router.post('/', protect, authorize('owner'), createFlat);
router.get('/owner', protect, authorize('owner'), getOwnerFlats);
router.get('/amenities', getAllAmenities);
router.get('/:id', protect, getFlatById);
router.delete('/:id', protect, authorize('owner'), deleteFlat);
router.put('/:id', protect, authorize('owner'), updateFlat);
router.post('/:id/book', protect, authorize('tenant'), createBooking);

export default router;
