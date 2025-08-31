// backend/src/validations/authValidation.ts
import { z } from 'zod';

export const registerUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().min(1, 'Phone number is required'),
  nid: z.string().min(1, 'NID is required'),
  userType: z.enum(['tenant', 'owner'], { message: 'Invalid user type. Must be tenant or owner.' })
});

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(1, 'Verification code is required'),
  verificationToken: z.string().min(1, 'Verification token is required'),
});

export const resendVerificationCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyPasswordResetCodeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  code: z.string().min(1, 'Verification code is required'),
});

export const setNewPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});
