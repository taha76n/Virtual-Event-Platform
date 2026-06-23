import { SQSClient } from '@aws-sdk/client-sqs';
import logger from './logger.js';

// Initialize the SQS Client
// It automatically picks up AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from .env
export const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // Endpoint can be overridden if using LocalStack for local dev
  ...(process.env.SQS_ENDPOINT && { endpoint: process.env.SQS_ENDPOINT }) 
});

export const QUEUE_URLS = {
  TICKET_EXPIRATION: process.env.SQS_TICKET_EXPIRATION_QUEUE_URL
};

export const checkSQSConnection = async () => {
  if (!QUEUE_URLS.TICKET_EXPIRATION) {
    logger.warn('SQS_TICKET_EXPIRATION_QUEUE_URL is not defined. Worker will not start.');
  } else {
    logger.info('AWS SQS Client initialized');
  }
};