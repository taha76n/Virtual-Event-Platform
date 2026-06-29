import * as ticketingService from '../services/ticketingService.js';
import crypto from 'crypto'; // Needed for verifying the Safepay signature
import logger from '../../../core/logger.js'; // Needed for logging webhook events
import { BadRequestError } from '../../../core/error.js';
import mongoose from 'mongoose';

/**
 * @desc    Initialize ticket checkout (Create soft reservation)
 * @route   POST /api/ticketing/checkout
 * @access  Private (Registered Attendees)
 */
export const checkout = async (req, res, next) => {
  try {
    const { eventId, ticketTypeId } = req.body;
    const userId = req.user.id; // Injected by requireAuth middleware

    // STRICT VALIDATION LAYER
    // In the future, this block can be replaced by a Zod schema middleware: e.g. validate(checkoutSchema)
    if (!eventId || typeof eventId !== 'string') {
      throw new BadRequestError('A valid eventId is strictly required');
    }
    if (!ticketTypeId || typeof ticketTypeId !== 'string') {
      throw new BadRequestError('A valid ticketTypeId is strictly required');
    }

    // Call the Service Layer
    const order = await ticketingService.reserveTicket(userId, eventId, ticketTypeId);

    // If successful, return the pending order
    res.status(201).json({
      success: true,
      message: 'Ticket temporarily reserved for 10 minutes. Please complete payment.',
      data: {
        orderId: order._id,
        expiresAt: order.expiresAt,
        status: order.status
      }
    });

  } catch (error) {
    // Passes our AppErrors directly to the Global Error Handler in the Canvas
    next(error);
  }
};

/**
 * @desc    Safepay Payment Webhook Listener
 * @route   POST /api/ticketing/webhook/safepay
 * @access  Public (But secured via Cryptographic Signature)
 */
export const safepayWebhook = async (req, res, next) => {
  try {
    // 1. EXTRACT HEADERS AND BODY
    // Payment providers always send a special signature in the headers.
    // This proves the request actually came from Safepay and not a hacker.
    const signature = req.headers['x-safepay-signature'];
    const payload = req.body;

    // 2. BASIC VALIDATION
    // If the header is missing entirely, reject it immediately.
    if (!signature) {
      logger.warn('Webhook received without Safepay signature');
      throw new BadRequestError('Missing webhook signature');
    }

    // 3. VERIFY THE SIGNATURE (Security Check)
    // We recreate the signature using our private Safepay Secret from our .env file
    // and compare it to the signature Safepay sent us. If they match, it's authentic!
    const secret = process.env.SAFEPAY_WEBHOOK_SECRET || 'test_secret';

    // Create an HMAC SHA256 hash of the incoming JSON body
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Compare our generated hash with Safepay's hash
    // (In production, use crypto.timingSafeEqual to prevent timing attacks, 
    // but a direct comparison is fine for understanding the logic)
    if (signature !== expectedSignature && process.env.NODE_ENV === 'production') {
      logger.error('Invalid Safepay webhook signature detected');
      throw new BadRequestError('Invalid webhook signature');
    }

    // 4. PROCESS THE EVENT
    // Safepay sends different "types" of events. We only care about successful payments right now.
    if (payload.eventType === 'payment.succeeded') {

      // Extract the data we passed to Safepay when the user clicked checkout.
      // We assume we passed our database orderId into Safepay's metadata.
      const orderId = payload.data.metadata.orderId;
      const safepaySessionId = payload.data.tracker; // Safepay's unique transaction ID

      logger.info(`Processing Safepay payment success for Order: ${orderId}`);

      // 5. CALL THE SERVICE LAYER
      // Hand the IDs over to our business logic to update the DB and create the Ticket.
      await ticketingService.completeOrder(orderId, safepaySessionId);
    } else {
      // If it's a different event (like a refund or failure), just log it for now
      logger.info(`Received unhandled Safepay event type: ${payload.eventType}`);
    }

    // 6. RESPOND TO SAFEPAY
    // CRITICAL: You MUST return a 200 OK to Safepay immediately. 
    // If you don't, Safepay thinks the request failed and will keep sending it 
    // over and over again for the next 3 days!
    res.status(200).json({ received: true });

  } catch (error) {
    // If something breaks, pass the error to our Global Error Handler
    next(error);
  }
};

