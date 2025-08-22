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
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

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
        // REMOVED: verificationCode and verificationCodeExpires are no longer stored in the DB
      },
    });

    // --- NEW: Generate verification code and temporary JWT ---
    const verificationCode = generateVerificationCode();
    const verificationExpires = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

    const verificationToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, code: verificationCode, expires: verificationExpires },
      process.env.JWT_SECRET as string, // Re-using JWT_SECRET for simplicity, consider a separate secret for verification tokens
      { expiresIn: '10m' } // Token itself expires in 10 minutes
    );
    // --- END NEW ---

    // --- NEW: Send verification email ---
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
    // --- END NEW ---

    // Send back a temporary token for verification flow, not a full auth token
    res.status(201).json({
      message: 'User registered successfully. Please check your email for a verification code.',
      verificationToken: verificationToken, // <-- NEW: Send temporary verification token
      userEmail: newUser.email, // <-- NEW: Send user email for verification page
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

// --- NEW: Verify Email Controller ---
export const verifyEmail = async (req: Request, res: Response) => {
  const { email, code, verificationToken } = req.body; // <-- NEW: Expect verificationToken

  if (!email || !code || !verificationToken) {
    return res.status(400).json({ message: 'Email, verification code, and token are required.' });
  }

  try {
    // --- NEW: Verify the temporary token ---
    const decodedToken = jwt.verify(verificationToken, process.env.JWT_SECRET as string) as VerificationTokenPayload;

    if (decodedToken.email !== email || decodedToken.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code or email.' });
    }

    if (decodedToken.expires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }
    // --- END NEW ---

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
      message: 'Email verified successfully!',
      token: authToken, // <-- NEW: Send full auth token
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
