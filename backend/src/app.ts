// backend/src/app.ts (Updated)
import express from 'express';
import cors from 'cors';
import path from 'path'; // <-- Add this import
import flatRoutes from './routes/flatRoutes';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- NEW: Serve static files from the 'uploads' directory ---
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic test route
app.get('/', (req, res) => {
  res.send('Flat Management Backend API is running!');
});

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/bookings', bookingRoutes);

export default app;