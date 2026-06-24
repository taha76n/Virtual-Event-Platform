import 'dotenv/config'; 
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http'; // 1. Import Node's built-in HTTP module

import connectDB from './core/database.js';
import logger, { requestLogger } from './core/logger.js';
import { checkSQSConnection } from './core/sqs.js';
import { checkSafepayConfig } from './core/safepay.js';
import { startTicketExpirationWorker } from './modules/ticketing/workers/ticketExpirationWorker.js';
import { initSocket } from './core/socket.js'; // 2. Import our WebSocket initializer

import cookieParser from 'cookie-parser';
const app = express();

// ==========================================
// CREATE RAW HTTP SERVER
// ==========================================
// We pass our Express 'app' into Node's raw HTTP server. 
// Now, 'server' handles the network connections, and 'app' just handles the routing.
const httpServer = createServer(app);

// ==========================================
// INITIALIZE WEBSOCKETS
// ==========================================
// We pass the raw HTTP server to Socket.io so it can attach its WebSocket upgrade listener.
// We store the returned 'io' instance in case we need to pass it to other workers later.
const io = initSocket(httpServer);

// Middleware
app.use(cors({
app.use('/api/catalog', catalogRoutes);
app.use('/api/ticketing', ticketingRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Virtual Event Platform API is running' });
});

// ==========================================
// GLOBAL ERROR HANDLER
// MUST be the last middleware!
// ==========================================
app.use(errorHandler);

// ==========================================
// START SERVER (UPDATED)
// ==========================================
const PORT = process.env.PORT || 5000;

// CRITICAL CHANGE: We call .listen() on 'httpServer', NOT on 'app'!
// If you call app.listen(), WebSockets will silently fail to connect.
httpServer.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`WebSockets ready and listening for connections`);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
const gracefulShutdown = () => {
  logger.info('Received shutdown signal (SIGINT/SIGTERM). Starting graceful shutdown...');
  
  if (ticketWorker) {
    ticketWorker.stop();
    logger.info('SQS Worker stopped polling.');
  }

  // 1. Stop accepting new HTTP requests (using httpServer now, not server)
  httpServer.close(async (err) => {
    if (err) {
      logger.error(`Error during HTTP server shutdown: ${err.message}`);
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