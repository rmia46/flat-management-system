// backend/src/routes/flatRoutes.ts
import { Router } from 'express';
import { createFlat, getAllFlats } from '../controllers/flatController';
import { protect, authorize } from '../middlewares/authMiddleware'; // Import auth middleware

const router = Router();

// Public route to get all available flats
router.get('/', getAllFlats);

// Protected route to create a flat (only by owners)
router.post('/', protect, authorize('owner'), createFlat);

export default router;
