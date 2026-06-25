import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http'; 

// Core Imports
import connectDB from './core/database.js';
import logger, { requestLogger } from './core/logger.js';
import { checkSQSConnection } from './core/awsSqs.js';
import { checkSafepayConfig } from './core/safepay.js';
import { initSocket } from './core/socket.js';
import { errorHandler } from './core/errorHandlerMiddleware.js';

// Worker Imports
import { startTicketExpirationWorker } from './modules/ticketing/workers/ticketExpiration.js';

// Module Route Imports
import authRoutes from './modules/auth/routes/authRoutes.js';
import catalogRoutes from './modules/catalog/routes/catalogRoutes.js';
import ticketingRoutes from './modules/ticketing/routes/ticketingRoutes.js';

// Load environment variables from .env file
dotenv.config();

// ==========================================
// SERVER INITIALIZATION
// ==========================================
const app = express();
const httpServer = createServer(app); // Native HTTP server for WebSockets
const io = initSocket(httpServer);    // Attach Socket.io to the HTTP server

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Use express.json() but EXCLUDE the webhook route so we can verify the raw signature
app.use('/api/ticketing/webhook/safepay', express.raw({ type: 'application/json' }));
app.use(express.json()); 

app.use(cookieParser());
app.use(requestLogger); // Custom Winston request logger

// ==========================================
// REST API ROUTING
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/ticketing', ticketingRoutes);

// Basic health check route for AWS/Docker load balancers
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Virtual Event Platform API is running' });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use(errorHandler); // MUST be the last middleware!

// ==========================================
// BOOT SEQUENCE & SERVICES
// ==========================================
const PORT = process.env.PORT || 5000;
let ticketWorker = null;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    
    // 2. Validate External Service Configurations
    checkSQSConnection();
    checkSafepayConfig();

    // 3. Start Background Workers
    ticketWorker = startTicketExpirationWorker();

    // 4. Start listening for HTTP and WebSocket traffic
    httpServer.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`WebSockets ready and listening for connections`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Starting graceful shutdown...');
  
  if (ticketWorker) {
    ticketWorker.stop();
    logger.info('SQS Worker stopped polling.');
  }

  httpServer.close(async (err) => {
    if (err) {
      logger.error(`Error during HTTP server shutdown: ${err.message}`);
      process.exit(1);
    }
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);