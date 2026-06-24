import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './logger.js';
import { registerChatHandlers } from '../modules/realtime/handlers/chatHandler.js';

// We declare a variable 'io' outside the function so we can reuse it later if needed
let io;

// Export a function that takes our standard Express 'httpServer' as an argument
export const initSocket = (httpServer) => {
  // We instantiate a new Socket.io server, attaching it to our existing HTTP server
  io = new Server(httpServer, {
    // Configure Cross-Origin Resource Sharing (CORS) specifically for WebSockets
    cors: {
      // Allow connections from our React frontend URL (or localhost during dev)
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      // Allow passing cookies and authorization headers
      credentials: true,
      // Define which HTTP methods are allowed for the initial handshake
      methods: ['GET', 'POST']
    }
  });

  // This is a Socket.io Middleware. It runs BEFORE a user is allowed to establish a connection.
  // 'socket' represents the incoming user, 'next' is the function to allow them in or block them.
  io.use((socket, next) => {
    // We attempt to extract the JWT token from the socket's handshake authentication object
    const token = socket.handshake.auth?.token;

    // If there is no token, we call next() with a new Error. This blocks the connection entirely.
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Try to cryptographically verify the token using our secret key
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decodedUser) => {
      // If the token is fake or expired, block the connection
      if (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }
      
      // If successful, we attach the decoded user data directly to the socket object.
      // Now, every time this user sends a message, we know exactly who they are via 'socket.user'!
      socket.user = decodedUser;
      
      // Allow the connection to proceed successfully
      next();
    });
  });

  // Listen for the 'connection' event, which fires every time a verified user successfully connects
  io.on('connection', (socket) => {
    // Log the successful connection with the user's ID
    logger.info(`User connectaed to WebSockets: ${socket.user.id} (Socket ID: ${socket.id})`);

    // Pass the socket to our specific Chat Handler to register its events (join room, send message)
    registerChatHandlers(io, socket);

    // Listen for the built-in 'disconnect' event, which fires when the user closes their browser
    socket.on('disconnect', () => {
      // Log the disconnection so we can track server load
      logger.info(`User disconnected: ${socket.user.id}`);
    });
  });

  // Return the configured 'io' instance in case other files need it
  return io;
};