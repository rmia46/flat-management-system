// backend/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        userType: string;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  console.log('--- Auth Middleware Debugging ---');
  console.log('Request Headers:', req.headers);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    console.log('Authorization header found.');
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Extracted Token:', token ? token.substring(0, 30) + '...' : 'No token extracted');

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; userType: string };
      console.log('Token Decoded Successfully. Decoded Payload:', decoded);

      req.user = {
        id: decoded.id,
        userType: decoded.userType,
      };
      console.log('req.user attached:', req.user);
      console.log('--- End Auth Middleware Debugging (Success) ---');
      next();
    } catch (error) {
      console.error('Token Verification Failed:', error);
      // If token is invalid or expired, log it but still call next() for public routes.
      // The controller (getFlatById) will then see req.user as undefined.
      req.user = undefined; // Explicitly set to undefined
      console.log('Token invalid/expired. Proceeding as unauthenticated.');
      next(); // <--- CRUCIAL CHANGE: Call next() even on token failure
    }
  } else {
    // No token provided. Proceed as unauthenticated.
    req.user = undefined; // Explicitly set to undefined
    console.log('No Authorization header or not starting with "Bearer". Proceeding as unauthenticated.');
    next(); // <--- CRUCIAL CHANGE: Call next() if no token is found
  }
  // Removed the 'res.status(401).json' response from here.
};

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
