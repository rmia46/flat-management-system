// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { sendEmail, generateVerificationCode } from '../services/mailService';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import {
  registerUserSchema,
  loginUserSchema,
  verifyEmailSchema,
  resendVerificationCodeSchema,
  forgotPasswordSchema,
  verifyPasswordResetCodeSchema,
  setNewPasswordSchema
} from '../validations/authValidation';

// Interfaces
interface VerificationTokenPayload {
  userId: number;
  email: string;
  code: string;
  expires: number;
}

interface PasswordResetTokenPayload {
  userId: number;
}

// --- Register User ---
export const registerUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, password, phone, nid, userType } = registerUserSchema.parse(req.body);

  const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingUserByEmail) {
    return next(new AppError('User with this email already exists.', 400));
  }

  const existingUserByPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingUserByPhone) {
    return next(new AppError('User with this phone number already exists.', 400));
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { firstName, lastName, email, passwordHash, phone, nid, userType, verified: false },
  });

  const verificationCode = generateVerificationCode();
  const verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  const verificationToken = jwt.sign(
    { userId: newUser.id, email: newUser.email, code: verificationCode, expires: verificationExpires },
    process.env.JWT_SECRET as string,
    { expiresIn: '10m' }
  );

  const emailHtml = `<h2>Email Verification</h2><p>Your verification code is: <strong>${verificationCode}</strong></p>`;
  await sendEmail(email, 'Verify Your Account', `Your verification code is: ${verificationCode}`, emailHtml);

  res.status(201).json({
    status: 'success',
    message: 'User registered. Please check your email for a verification code.',
    data: { verificationToken, userEmail: newUser.email },
  });
});

// --- Login User ---
export const loginUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = loginUserSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return next(new AppError('Invalid credentials.', 400));
  }

  if (!user.verified) {
    return next(new AppError('Account not verified. Please verify your email.', 403));
  }

  const token = jwt.sign({ id: user.id, userType: user.userType }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  res.status(200).json({
    status: 'success',
    message: 'Logged in successfully',
    data: {
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, userType: user.userType, verified: user.verified },
    },
  });
});

// --- Verify Email ---
export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, code, verificationToken } = verifyEmailSchema.parse(req.body);

  const decodedToken = jwt.verify(verificationToken, process.env.JWT_SECRET as string) as VerificationTokenPayload;

  if (decodedToken.email !== email || decodedToken.code !== code) {
    return next(new AppError('Invalid verification code or email.', 400));
  }

  if (decodedToken.expires < Date.now()) {
    return next(new AppError('Verification code has expired.', 400));
  }

  const user = await prisma.user.update({
    where: { email, verified: false },
    data: { verified: true },
    select: { id: true, firstName: true, lastName: true, email: true, userType: true, verified: true },
  });

  if (!user) {
    return next(new AppError('User not found or already verified.', 404));
  }

  const authToken = jwt.sign({ id: user.id, userType: user.userType }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully! You are now logged in.',
    data: { token: authToken, user },
  });
});

// --- Resend Verification Code ---
export const resendVerificationCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = resendVerificationCodeSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return next(new AppError('User not found.', 404));
  }
  if (user.verified) {
    return next(new AppError('Account is already verified.', 400));
  }

  const verificationCode = generateVerificationCode();
  const verificationExpires = Date.now() + 10 * 60 * 1000;

  const verificationToken = jwt.sign(
    { userId: user.id, email: user.email, code: verificationCode, expires: verificationExpires },
    process.env.JWT_SECRET as string,
    { expiresIn: '10m' }
  );

  const emailHtml = `<h2>New Verification Code</h2><p>Your new code is: <strong>${verificationCode}</strong></p>`;
  await sendEmail(email, 'New Verification Code', `Your new code is: ${verificationCode}`, emailHtml);

  res.status(200).json({
    status: 'success',
    message: 'New verification code sent.',
    data: { verificationToken, userEmail: user.email },
  });
});

// --- Forgot Password ---
export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const verificationCode = generateVerificationCode();
    const verificationExpires = Date.now() + 10 * 60 * 1000;

    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, code: verificationCode, expires: verificationExpires },
      process.env.JWT_SECRET as string,
      { expiresIn: '10m' }
    );

    const emailHtml = `<h2>Password Reset Code</h2><p>Your code is: <strong>${verificationCode}</strong></p>`;
    await sendEmail(email, 'Password Reset Code', `Your code is: ${verificationCode}`, emailHtml);

    res.status(200).json({
        status: 'success',
        message: 'If a user with that email exists, a password reset code has been sent.',
        data: { resetToken },
    });
  } else {
    // Still return a success message for security
    res.status(200).json({
        status: 'success',
        message: 'If a user with that email exists, a password reset code has been sent.',
    });
  }
});

// --- Verify Password Reset Code ---
export const verifyPasswordResetCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token, code } = verifyPasswordResetCodeSchema.parse(req.body);

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as VerificationTokenPayload;

  if (decodedToken.code !== code || decodedToken.expires < Date.now()) {
    return next(new AppError('Invalid or expired verification code.', 400));
  }

  const user = await prisma.user.findUnique({ where: { id: decodedToken.userId } });
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  const passwordChangeToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '10m' });

  res.status(200).json({
    status: 'success',
    message: 'Verification successful.',
    data: { passwordChangeToken },
  });
});

// --- Set New Password ---
export const setNewPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token, newPassword } = setNewPasswordSchema.parse(req.body);

  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as PasswordResetTokenPayload;

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: decoded.userId },
    data: { passwordHash },
  });

  res.status(200).json({ status: 'success', message: 'Password has been reset successfully.' });
});