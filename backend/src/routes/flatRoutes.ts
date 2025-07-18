// backend/src/routes/flatRoutes.ts
import { Router } from 'express';
import { createFlat, getAllFlats, getOwnerFlats } from '../controllers/flatController';
import { protect, authorize } from '../middlewares/authMiddleware'; // Import auth middleware

const router = Router();

// Public route to get all available flats
router.get('/', getAllFlats);

// Protected route to create a flat (only by owners)
router.post('/', protect, authorize('owner'), createFlat);

// Protected route for owners to get their own flats
router.get('/owner', protect, authorize('owner'), getOwnerFlats);

export default router;
