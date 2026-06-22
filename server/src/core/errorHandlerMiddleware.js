import logger from './logger.js';
import { AppError } from './errors.js';

/**
 * Global Error Handling Middleware for Express.
 * Catches all thrown errors (including our custom AppErrors) and formats the HTTP response.
 */
export const errorHandler = (err, req, res, next) => {
  let { statusCode, message, code } = err;

  // If the error isn't an instance of our custom AppError, it's an unhandled server crash
  if (!(err instanceof AppError)) {
    statusCode = 500;
    message = 'Internal Server Error';
    code = 'SERVER_ERROR';
    // Log the full stack trace for unknown errors
    logger.error(`[Unhandled Error] ${err.message}\n${err.stack}`);
  } else {
    // Log known application errors as warnings or info depending on severity
    if (statusCode >= 500) {
      logger.error(`[${code}] ${message}`);
    } else {
      logger.warn(`[${code}] ${message} - Path: ${req.originalUrl}`);
    }
  }

  // Send consistent error payload to the React frontend
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      // Only include stack traces in development mode for easier debugging
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};