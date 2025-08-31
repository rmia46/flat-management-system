// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
  forgotPassword, 
  verifyPasswordResetCode, 
  setNewPassword, 
} from '../controllers/authController';

const router = Router();

// Public routes for authentication
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);

// Password Reset Flow
router.post('/forgot-password', forgotPassword); // Sends a code to email
router.post('/verify-password-reset-code', verifyPasswordResetCode); // Verifies the code
router.post('/set-new-password', setNewPassword); // Sets the new password

export default router;
