import winston from 'winston';

// Define the custom format for our logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Create the Winston logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console()
    // Later, we can add a CloudWatch transport here for AWS integration
  ],
});

/**
 * Express Middleware to track incoming API requests.
 * Logs the HTTP Method, URL, Status Code, and Response Time.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Wait for the response to finish before logging to get the final status and duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
};

export default logger;