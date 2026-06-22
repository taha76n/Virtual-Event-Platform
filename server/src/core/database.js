import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Initializes the MongoDB connection.
 * We use a single connection pool for the entire monolith.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;