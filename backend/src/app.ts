// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import flatRoutes from './routes/flatRoutes';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes'; 
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
  res.send('Flat Management Backend API is running!');
});

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/bookings', bookingRoutes);

export default app;