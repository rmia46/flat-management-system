// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db'; // Import your Prisma Client instance
import { sendEmail, generateVerificationCode } from '../services/mailService'; 

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

    // --- NEW: Generate verification code and expiry ---
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // Code expires in 10 minutes

    // Create new user in the database
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
        verificationCode,
        verificationCodeExpires,
      },
    });

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

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, userType: newUser.userType },
      process.env.JWT_SECRET as string, // Cast to string as process.env can be undefined
      { expiresIn: '1h' }
    );

    // Send back user data (excluding passwordHash) and token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        nid: newUser.nid,
        userType: newUser.userType,
        verified: newUser.verified,
      },
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

    if (!user.verified) {
      // Option 1: Prevent login and prompt for verification
      return res.status(403).json({ message: 'Account not verified. Please verify your email to log in.', email: user.email });
      // Option 2: Allow login but show a warning on dashboard
    }

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, userType: user.userType },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' } // <-- NEW: Shorten for testing
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
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.verified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please register again or request a new code.' });
    }

    // Update user to verified and clear verification details
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationCode: null,
        verificationCodeExpires: null,
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

    // Optionally, generate a new token for the now verified user, or rely on them logging in
    const token = jwt.sign(
        { id: updatedUser.id, userType: updatedUser.userType },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Email verified successfully!',
      token,
      user: updatedUser,
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification.' });
  }
};
