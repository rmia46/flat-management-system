// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { registerUser, loginUser, verifyEmail, resendVerificationCode } from '../controllers/authController'; // <-- NEW: Import resendVerificationCode

const router = Router();

// Public routes for authentication
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);

export default router;
