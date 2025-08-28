// backend/src/routes/reviewRoutes.ts
import { Router } from 'express';
import { createReview, getReviewsForFlat } from '../controllers/reviewController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Route to get all reviews for a specific flat (public)
router.get('/:flatId', getReviewsForFlat);

// Route to create a new review for a flat (only authenticated users)
router.post('/:flatId', protect, createReview);

export default router;