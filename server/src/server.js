import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser"
import mongoose from 'mongoose';
import connectDB from './core/database.js';
import logger, { requestLogger } from './core/logger.js';
import authRoutes from './modules/auth/routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(requestLogger); // Attach our Winston request tracking middleware

connectDB();

// ==========================================
// MODULE ROUTING (Modular Monolith Boundaries)
// ==========================================
app.use('/api/auth', authRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Virtual Event Platform API is running' });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
const gracefulShutdown = () => {
  logger.info('Received shutdown signal (SIGINT/SIGTERM). Starting graceful shutdown...');
  
  // 1. Stop accepting new HTTP requests
  server.close(async (err) => {
    if (err) {
      logger.error(`Error closing Express server: ${err.message}`);
      process.exit(1);
    }
    logger.info('Express HTTP server closed.');

    try {
      // 2. Close MongoDB connection cleanly
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');
      
      // 3. Exit process successfully
      logger.info('Graceful shutdown completed successfully. Exiting process.');
      process.exit(0);
    } catch (dbErr) {
      logger.error(`Error during MongoDB disconnection: ${dbErr.message}`);
      process.exit(1);
    }
  });
  
  // Failsafe: Force shut down if closing takes longer than 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals (Docker sends SIGTERM, Ctrl+C sends SIGINT)
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);