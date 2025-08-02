// backend/src/server.ts
import app from './app';
import dotenv from 'dotenv';

// Load environment variables from .env file
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production') {
    dotenv.config();
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});
