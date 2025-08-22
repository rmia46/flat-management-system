// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { registerUser, loginUser, verifyEmail } from '../controllers/authController';


const router = Router();

// Public routes for authentication
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);

export default router;
