// backend/src/routes/flatRoutes.ts
import { Router } from 'express';
import {
  createFlat, getAllFlats, getOwnerFlats, getFlatById, deleteFlat, updateFlat, getAllAmenities,
  createBooking,
} from '../controllers/flatController';
import { protect, authorize } from '../middlewares/authMiddleware';
import upload from '../multerConfig';

const router = Router();

// --- Flat & Amenity Routes ---
router.get('/', getAllFlats);

// MODIFIED: Changed from upload.single('image') to upload.array('images', 10)
// This allows up to 10 images to be uploaded under the field name 'images'.
router.post('/', protect, authorize('owner'), upload.array('images', 10), createFlat);

router.get('/owner', protect, authorize('owner'), getOwnerFlats);
router.get('/amenities', getAllAmenities);
router.get('/:id', protect, getFlatById);
router.delete('/:id', protect, authorize('owner'), deleteFlat);

// MODIFIED: Also update the PUT route for editing flats
router.put('/:id', protect, authorize('owner'), upload.array('images', 10), updateFlat);

router.post('/:id/book', protect, authorize('tenant'), createBooking);

export default router;