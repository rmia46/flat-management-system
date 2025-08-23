// backend/src/routes/flatRoutes.ts (Updated)
import { Router } from 'express';
import {
  createFlat, getAllFlats, getOwnerFlats, getFlatById, deleteFlat, updateFlat, getAllAmenities,
  createBooking,
} from '../controllers/flatController';
import { protect, authorize } from '../middlewares/authMiddleware';
import upload from '../multerConfig'; // <-- Import the multer config

const router = Router();

// --- Flat & Amenity Routes ---
router.get('/', getAllFlats);

// Use upload.single('image') middleware for creating a flat
// 'image' must match the field name in the FormData on the frontend
router.post('/', protect, authorize('owner'), upload.single('image'), createFlat);

router.get('/owner', protect, authorize('owner'), getOwnerFlats);
router.get('/amenities', getAllAmenities);
router.get('/:id', protect, getFlatById);
router.delete('/:id', protect, authorize('owner'), deleteFlat);

// Use middleware for updating a flat as well
router.put('/:id', protect, authorize('owner'), upload.single('image'), updateFlat);

router.post('/:id/book', protect, authorize('tenant'), createBooking);

export default router;