// backend/src/routes/reviewRoutes.ts
import { Router } from 'express';
import { upsertReview, getReviewsForFlat } from '../controllers/reviewController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Route to get all reviews for a specific flat (public)
router.get('/:flatId', getReviewsForFlat);

// Route to create or update a review (only authenticated users)
router.post('/', protect, upsertReview);

export default router;