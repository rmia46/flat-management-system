// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import flatRoutes from './routes/flatRoutes';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import reviewRoutes from './routes/reviewRoutes'; // NEW: Import review routes
import handleGlobalError from './middlewares/errorMiddleware';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('Flat Management Backend API is running!');
});

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// Global Error Handling Middleware
app.use(handleGlobalError);

export default app;