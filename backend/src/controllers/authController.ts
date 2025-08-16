// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db'; // Import your Prisma Client instance

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
      },
    });

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

