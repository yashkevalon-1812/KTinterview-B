import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start Express server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Kevalon Interview Drive API running dynamically on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

startServer();
