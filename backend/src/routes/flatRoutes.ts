// backend/src/routes/flatRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import { createFlat, getAllFlats, getOwnerFlats, getFlatById, updateFlat, deleteFlat } from '../controllers/flatController';
import { protect, authorize } from '../middlewares/authMiddleware'; // Import auth middleware

const router = Router();

// Public route to get all available flats
router.get('/', getAllFlats);

// Protected route to create a flat (only by owners)
router.post('/', protect, authorize('owner'), createFlat);

// Protected route for owners to get their own flats
router.get('/owner', protect, authorize('owner'), getOwnerFlats);

// Public route to get a single flat's details by ID (data visible conditionally)
router.get('/:id', protect, getFlatById);

// Protected route to delete a flat (owner only)
router.delete('/:id', protect, authorize('owner'), deleteFlat);

// Protected route to update a flat (owner only)
router.put('/:id', protect, authorize('owner'), updateFlat);

export default router;
