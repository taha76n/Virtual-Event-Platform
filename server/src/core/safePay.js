import logger from './logger.js';

/**
 * Centralized Safepay Configuration
 * This ensures our app easily switches between test and live payment environments.
 */
export const SAFEPAY_CONFIG = {
  // Toggle between 'sandbox' (for testing) and 'production' (for real money)
  environment: process.env.SAFEPAY_ENVIRONMENT || 'sandbox',
  
  // Used to make outgoing API calls to Safepay (e.g., generating a checkout link)
  apiKey: process.env.SAFEPAY_API_KEY,
  
  // Used to cryptographically verify incoming webhooks from Safepay
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET,
  
  // Automatically select the correct base URL based on the environment
  apiUrl: process.env.SAFEPAY_ENVIRONMENT === 'production' 
    ? 'https://api.getsafepay.com' 
    : 'https://sandbox.api.getsafepay.com'
};

/**
 * Boot-up check to ensure payment credentials exist before the server starts taking traffic.
 */
export const checkSafepayConfig = () => {
  if (!SAFEPAY_CONFIG.apiKey || !SAFEPAY_CONFIG.webhookSecret) {
    logger.warn('⚠️ Safepay credentials missing in .env! Ticketing checkouts and webhooks will fail.');
  } else {
    logger.info(`Safepay initialized in [${SAFEPAY_CONFIG.environment.toUpperCase()}] mode`);
  }
};