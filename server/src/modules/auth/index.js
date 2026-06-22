import jwt from 'jsonwebtoken';
import { User } from './models/user.js';
import logger from '../../core/logger.js';

/**
 * PUBLIC INTERFACE FOR THE AUTH MODULE
 */

export const getUserById = async (userId) => {
  return await User.findById(userId).select('-__v');
};

export const getUsersByIds = async (userIdsArray) => {
  return await User.find({ _id: { $in: userIdsArray } }).select('-__v');
};

export const requireAuth = async (req, res, next) => {
  // Look for token in cookies first
  let token = req.cookies?.accessToken;

  // Fallback to Authorization header (useful for server-to-server or Postman testing)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; 

    if (req.user.status === 'suspended') {
      logger.warn(`Suspended user attempted access: ${req.user.id}`);
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(`Role authorization failed for user ${req.user ? req.user.id : 'Unknown'}. Required: ${roles.join(', ')}`);
      return res.status(403).json({ 
        success: false, 
        message: `Role not authorized to access this route` 
      });
    }
    next();
  };
};