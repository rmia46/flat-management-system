// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db'; // Import your Prisma Client instance
import { sendEmail, generateVerificationCode } from '../services/mailService'; 

// Define a type for the temporary verification token payload
interface VerificationTokenPayload {
  userId: number;
  email: string;
  code: string;
  expires: number; // Unix timestamp
}

// --- Register User ---
export const registerUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, phone, nid, userType } = req.body;

  // Basic validation (you'll want more robust validation later)
  if (!firstName || !lastName || !email || !password || !phone || !nid || !userType) {
    return res.status(400).json({ message: 'Please enter all required fields.' });
  }

  // Ensure userType is valid
  if (!['tenant', 'owner'].includes(userType)) {
    return res.status(400).json({ message: 'Invalid user type. Must be "tenant" or "owner".' });
  }

  try {
    // Check if user with this email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // --- Check if user with this phone number already exists ---
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUserByPhone) {
      return res.status(400).json({ message: 'User with this phone number already exists.' });
    }
    // --- END NEW ---

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user in the database (initially unverified)
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
        nid,
        userType,
        verified: false, // Default to not verified upon registration
      },
    });

    // --- Generate verification code and temporary JWT ---
    const verificationCode = generateVerificationCode();
    const verificationExpires = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

    const verificationToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, code: verificationCode, expires: verificationExpires },
      process.env.JWT_SECRET as string,
      { expiresIn: '10m' }
    );
    // --- End Generate verification code and temporary JWT ---

    // --- Send verification email ---
    const emailSubject = 'Verify Your Flat Management System Account';
    const emailText = `Your verification code is: ${verificationCode}. It will expire in 10 minutes.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Email Verification</h2>
        <p>Thank you for registering with Flat Management System!</p>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 10 minutes. Please enter it on the verification page to activate your account.</p>
        <p>If you did not register for an account, please ignore this email.</p>
        <p>Best regards,<br/>The Flat Management Team</p>
      </div>
    `;
    await sendEmail(email, emailSubject, emailText, emailHtml);
    // --- End Send verification email ---

    // Send back a temporary token for verification flow, not a full auth token
    res.status(201).json({
      message: 'User registered successfully. Please check your email for a verification code.',
      verificationToken: verificationToken,
      userEmail: newUser.email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// --- Login User ---
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields.' });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // --- Check if user is verified ---
    if (!user.verified) {
      // Ensure the email is included in the response for the frontend to use
      return res.status(403).json({ message: 'Account not verified. Please verify your email to log in.', email: user.email });
    }
    // --- END Check ---

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, userType: user.userType },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // Send back user data (excluding passwordHash) and token
    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// --- Verify Email Controller ---
export const verifyEmail = async (req: Request, res: Response) => {
  const { email, code, verificationToken } = req.body;

  if (!email || !code || !verificationToken) {
    return res.status(400).json({ message: 'Email, verification code, and token are required.' });
  }

  try {
    // --- Verify the temporary token ---
    const decodedToken = jwt.verify(verificationToken, process.env.JWT_SECRET as string) as VerificationTokenPayload;

    if (decodedToken.email !== email || decodedToken.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code or email.' });
    }

    if (decodedToken.expires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }
    // --- End Verify the temporary token ---

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.verified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    // Update user to verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
      },
      select: { // Select fields to return
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userType: true,
        verified: true,
        phone: true,
        nid: true,
      }
    });

    // Generate a new, full authentication token for the now verified user
    const authToken = jwt.sign(
        { id: updatedUser.id, userType: updatedUser.userType },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Email verified successfully! You are now logged in.',
      token: authToken,
      user: updatedUser,
    });

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Verification token has expired. Please request a new code.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification.' });
  }
};

// --- Resend Verification Code Controller ---
export const resendVerificationCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required to resend verification code.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.verified) {
      return res.status(400).json({ message: 'Account is already verified.' });
    }

    // Generate a new verification code and temporary JWT
    const newVerificationCode = generateVerificationCode();
    const newVerificationExpires = Date.now() + 10 * 60 * 1000; // New code expires in 10 minutes

    const newVerificationToken = jwt.sign(
      { userId: user.id, email: user.email, code: newVerificationCode, expires: newVerificationExpires },
      process.env.JWT_SECRET as string,
      { expiresIn: '10m' }
    );

    // Send new verification email
    const emailSubject = 'New Verification Code for Flat Management System Account';
    const emailText = `Your new verification code is: ${newVerificationCode}. It will expire in 10 minutes.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Email Verification - New Code</h2>
        <p>You have requested a new verification code for your Flat Management System account.</p>
        <p>Your new verification code is: <strong>${newVerificationCode}</strong></p>
        <p>This code will expire in 10 minutes. Please enter it on the verification page to activate your account.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br/>The Flat Management Team</p>
      </div>
    `;
    await sendEmail(email, emailSubject, emailText, emailHtml);

    res.status(200).json({
      message: 'New verification code sent successfully. Please check your email.',
      verificationToken: newVerificationToken,
      userEmail: user.email,
    });

  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ message: 'Server error during resending verification code.' });
  }
};

// NEW: Password Reset Token Payload
interface PasswordResetTokenPayload {
  userId: number;
  expires: number; // Unix timestamp
}


// --- NEW: Forgot Password Controller (sends verification code) ---
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, always return a success message, but do nothing.
      return res.status(200).json({ message: 'If a user with that email exists, a password reset code has been sent.' });
    }

    // Generate and store a verification code, similar to the email verification flow
    const verificationCode = generateVerificationCode();
    const verificationExpires = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

    // Create a temporary JWT token to carry the code and user ID
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, code: verificationCode, expires: verificationExpires },
      process.env.JWT_SECRET as string,
      { expiresIn: '10m' }
    );

    // Send the password reset email with the code
    const emailSubject = 'Password Reset Code for Flat Management System';
    const emailText = `Your password reset code is: ${verificationCode}. It will expire in 10 minutes.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Password Reset Code</h2>
        <p>You recently requested to reset your password. Please use the following code to continue the process:</p>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 10 minutes. Please enter it on the password reset page.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br/>The Flat Management Team</p>
      </div>
    `;

    await sendEmail(email, emailSubject, emailText, emailHtml);

    res.status(200).json({
      message: 'If a user with that email exists, a password reset code has been sent.',
      resetToken // Send this back for the frontend to hold onto
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request.' });
  }
};

// --- NEW: Verify Password Reset Code Controller ---
export const verifyPasswordResetCode = async (req: Request, res: Response) => {
  const { token, code } = req.body;

  if (!token || !code) {
    return res.status(400).json({ message: 'Token and verification code are required.' });
  }

  try {
    // Verify the temporary token to get the user and code
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as VerificationTokenPayload;

    if (decodedToken.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (decodedToken.expires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate a new token that allows the password change
    const passwordChangeToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '10m' } // This token allows for password change, also expires
    );

    res.status(200).json({
      message: 'Verification successful. You can now set your new password.',
      passwordChangeToken
    });

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Verification token has expired. Please request a new code.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }
    console.error('Password reset verification error:', error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
};


// --- NEW: Set New Password Controller ---
export const setNewPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as PasswordResetTokenPayload;
    const { userId } = decoded;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Password reset token has expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid password reset token.' });
    }
    console.error('Set new password error:', error);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};
