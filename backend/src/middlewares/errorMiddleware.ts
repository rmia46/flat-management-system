// backend/src/middlewares/errorMiddleware.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

const handleGlobalError: ErrorRequestHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Something went wrong!';

  console.error('ERROR 💥', err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
};

export default handleGlobalError;
