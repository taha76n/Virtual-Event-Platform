import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { RefreshToken } from '../models/refreshToken.js';
import { User } from '../models/user.js';
import logger from '../../../core/logger.js';


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, status: user.status },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

const generateAndSaveRefreshToken = async (userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token,
    userId,
    expiresAt
  });

  return token;
};

export const googleLogin = async (req, res) => {
  const { tokenId } = req.body;

  if (!tokenId) {
    return res.status(400).json({ success: false, message: 'Google token is required' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { email, name, picture, sub } = ticket.getPayload();

    let user = await User.findOne({ oauthProvider: 'google', oauthId: sub });

    if (!user) {
      user = await User.create({
        name,
        email,
        avatarUrl: picture,
        oauthProvider: 'google',
        oauthId: sub,
        role: 'attendee',
        status: 'active'
      });
      logger.info(`New user registered via Google: ${email}`);
    } else if (user.status === 'suspended') {
      logger.warn(`Suspended user attempted login: ${email}`);
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    } else {
      logger.info(`User logged in: ${email}`);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateAndSaveRefreshToken(user._id);

    const isProd = process.env.NODE_ENV === 'production';

    // Set Access Token Cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Set Refresh Token Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role
      }
      // Tokens removed from JSON body
    });

  } catch (error) {
    logger.error(`Google Auth Error: ${error.message}`);
    res.status(401).json({ success: false, message: 'Invalid Google Token' });
  }
};

export const refreshToken = async (req, res) => {
  // Read token from cookies instead of request body
  const { refreshToken: token } = req.cookies;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const tokenDoc = await RefreshToken.findOne({ token });
    if (!tokenDoc) {
      logger.warn(`Attempted to use invalid or revoked refresh token`);
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'User suspended or deleted' });
    }

    const newAccessToken = generateAccessToken(user);

    logger.debug(`Access token refreshed for user: ${user.email}`);

    // Update the Access Token Cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.status(200).json({
      success: true
      // Token removed from JSON body
    });

  } catch (error) {
    logger.error(`Refresh Token Error: ${error.message}`);
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req, res) => {
  // Read token from cookies
  const { refreshToken: token } = req.cookies;

  try {
    if (token) {
      await RefreshToken.findOneAndDelete({ token });
    }
    
    // Clear cookies on the client
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Logout Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};