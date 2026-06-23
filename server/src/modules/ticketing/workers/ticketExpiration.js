import { Consumer } from 'sqs-consumer';
import { sqsClient, QUEUE_URLS } from '../../../core/sqs.js';
import * as ticketingService from '../services/ticketingService.js';
import logger from '../../../core/logger.js';

export const startTicketExpirationWorker = () => {
  if (!QUEUE_URLS.TICKET_EXPIRATION) {
    return; // Don't start if no URL is provided
  }

  const app = Consumer.create({
    queueUrl: QUEUE_URLS.TICKET_EXPIRATION,
    sqs: sqsClient,
    handleMessage: async (message) => {
      try {
        const payload = JSON.parse(message.Body);
        
        if (payload.orderId) {
          logger.debug(`Processing expiration for Order: ${payload.orderId}`);
          await ticketingService.releaseExpiredOrder(payload.orderId);
        }
      } catch (error) {
        logger.error(`Error processing SQS message: ${error.message}`);
        // Throwing the error tells sqs-consumer to NOT delete the message, 
        // so it will be returned to the queue for a retry.
        throw error; 
      }
    }
  });

  app.on('error', (err) => {
    logger.error(`SQS Consumer Error: ${err.message}`);
  });

  app.on('processing_error', (err) => {
    logger.error(`SQS Processing Error: ${err.message}`);
  });

  app.start();
  logger.info('Ticket Expiration SQS Worker started successfully');
  
  return app;
};