// backend/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db'; // Import your Prisma Client instance

// Extend the Express Request interface to include user property
// This allows TypeScript to recognize 'req.user'
declare global {
  namespace Express {
    interface Request {
      user?: { // Make it optional in case middleware is used on public routes
        id: number;
        userType: string;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check for token in 'Authorization' header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., 'Bearer TOKEN_STRING')
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; userType: string };

      // Attach user information to the request object
      req.user = {
        id: decoded.id,
        userType: decoded.userType,
      };

      next(); // Proceed to the next middleware/controller
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

// Middleware to restrict access based on user type
export const authorize = (...userTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not authenticated.' });
    }
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({ message: 'Not authorized to access this route.' });
    }
    next();
  };
};
