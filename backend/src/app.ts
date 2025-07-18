// backend/src/app.ts
import express from 'express';
import cors from 'cors';
// import flatRoutes from './routes/flatRoutes'; // Will create this later
import authRoutes from './routes/authRoutes'; // Will create this later

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Enable JSON body parsing

// Basic test route
app.get('/', (req, res) => {
  res.send('Flat Management Backend API is running!');
});

// Register API routes
app.use('/api/auth', authRoutes);
// app.use('/api/flats', flatRoutes);

export default app;
