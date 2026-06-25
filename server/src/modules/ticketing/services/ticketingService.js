import { SendMessageCommand } from '@aws-sdk/client-sqs';
import crypto from 'crypto'; // Built-in Node.js module for generating secure random strings
import logger from '../../../core/logger.js';
import { sqsClient, QUEUE_URLS } from '../../../core/awsSqs.js';
import * as catalogModule from '../../catalog/index.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../../core/error.js';
import { Order } from '../models/Order.js';
import { Ticket } from '../models/ticket.js';
import { TicketType } from '../models/ticketType.js';

export const reserveTicket = async (userId, eventId, ticketTypeId) => {
  const isPublished = await catalogModule.isEventPublished(eventId);
  if (!isPublished) {
    throw new BadRequestError('Event is not available or not published');
  }

  const ticketType = await TicketType.findById(ticketTypeId);
  if (!ticketType || ticketType.eventId.toString() !== eventId) {
    throw new NotFoundError('Ticket type not found for this event');
  }

  const now = new Date();
  if (ticketType.saleWindowStart && now < ticketType.saleWindowStart) throw new BadRequestError('Tickets are not on sale yet');
  if (ticketType.saleWindowEnd && now > ticketType.saleWindowEnd) throw new BadRequestError('Ticket sale window has closed');

  // ATOMIC INVENTORY LOCK
  const updatedType = await TicketType.findOneAndUpdate(
    {
      _id: ticketTypeId,
      $expr: { $lt: [{ $add: ["$soldCount", "$lockedCount"] }, "$capacity"] }
    },
    { $inc: { lockedCount: 1 } },
    { new: true }
  );

  if (!updatedType) {
    throw new ConflictError('Tickets are completely sold out or currently locked by other users');
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute soft reservation

  const order = await Order.create({
    userId,
    eventId,
    ticketTypeId,
    status: 'pending',
    expiresAt
  });

  // SEND MESSAGE TO AWS SQS (With 10 minute delay)
  if (QUEUE_URLS.TICKET_EXPIRATION) {
    try {
      const command = new SendMessageCommand({
        QueueUrl: QUEUE_URLS.TICKET_EXPIRATION,
        MessageBody: JSON.stringify({ orderId: order._id }),
        DelaySeconds: 600 // 10 minutes delay exactly
      });
      await sqsClient.send(command);
      logger.debug(`Expiration message queued for Order: ${order._id}`);
    } catch (error) {
      logger.error(`Failed to queue SQS message for order ${order._id}: ${error.message}`);
      // Note: In a hyper-resilient system, you'd have a fallback cron job to clean up 
      // orphans if SQS fails here, but we will rely on SQS for now.
    }
  }

  return order;
};

/**
 * Handles the SQS Message when it arrives 10 minutes later.
 * Releases the lock if the user never completed payment.
 */
export const releaseExpiredOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) return;

  // IDEMPOTENCY CHECK: Only release if it's STILL pending
  if (order.status !== 'pending') {
    logger.debug(`Order ${orderId} is ${order.status}. No lock release needed.`);
    return;
  }

  // Double check the timestamp just in case
  if (new Date() < order.expiresAt) {
    logger.warn(`Order ${orderId} received early from SQS. Ignoring.`);
    return; // SQS will retry later if message isn't deleted
  }

  // 1. Mark order as expired
  order.status = 'expired';
  await order.save();

  // 2. Decrement the lock count so someone else can buy it
  await TicketType.findByIdAndUpdate(order.ticketTypeId, {
    $inc: { lockedCount: -1 }
  });

  logger.info(`Released expired lock for Order ${orderId}`);
};

/**
 * Completes a pending order after a successful payment webhook is received.
 * It marks the order as paid, finalizes inventory, and generates the Ticket.
 */
export const completeOrder = async (orderId, safepaySessionId) => {
  // 1. Fetch the Order from the database
  const order = await Order.findById(orderId);
  
  // 2. If the order doesn't exist, throw an error so the webhook controller knows it failed
  if (!order) {
    throw new NotFoundError('Order not found in database');
  }

  // 3. THE IDEMPOTENCY CHECK (Extremely Important!)
  // Webhooks can sometimes be sent twice by payment providers due to network retries.
  // If the order is ALREADY paid, we do not want to generate a second ticket or crash.
  // We simply find the existing ticket and return it, acting as if it just succeeded.
  if (order.status === 'paid') {
    logger.debug(`Idempotent webhook hit: Order ${orderId} is already paid.`);
    // Fetch the ticket that was already created for this order
    const existingTicket = await Ticket.findOne({ orderId: order._id });
    return existingTicket; // Return it peacefully
  }

  // 4. The "Too Late" Check
  // If the SQS worker already marked this as expired because they took 11 minutes to pay,
  // we must reject it. (In the real world, you would trigger an automatic refund here).
  if (order.status === 'expired') {
    logger.error(`Payment received for EXPIRED order ${orderId}. Requires manual refund.`);
    throw new ConflictError('Order expired before payment was completed.');
  }

  // 5. UPDATE INVENTORY (The final shift)
  // The user paid, so this is no longer a "soft lock". It is a finalized sale.
  // We need to decrease the lockedCount by 1, and increase the soldCount by 1.
  await TicketType.findByIdAndUpdate(order.ticketTypeId, {
    // $inc is MongoDB's atomic operator for math. 
    // It prevents race conditions if many things update at once.
    $inc: { 
      lockedCount: -1, // Remove it from the temporary lock
      soldCount: 1     // Add it to the permanent sales
    }
  });

  // 6. UPDATE ORDER STATUS
  // We update the order to reflect the successful payment and attach the Safepay ID for accounting.
  order.status = 'paid';
  order.safepaySessionId = safepaySessionId;
  await order.save(); // Save the updated order to MongoDB

  // 7. GENERATE THE QR CODE STRING
  // We use Node's built-in crypto to generate a completely random, secure 32-character string.
  // We store this STRING in the database. The React frontend will convert this string into 
  // an actual visual square QR code using a library like 'qrcode.react'.
  const uniqueQrString = crypto.randomBytes(16).toString('hex');

  // 8. CREATE THE FINAL TICKET
  // This is the document the user will actually see and use to get into the event.
  const finalTicket = await Ticket.create({
    orderId: order._id,              // Link it back to the financial order
    userId: order.userId,            // Link it to the user who bought it
    eventId: order.eventId,          // Link it to the parent event
    ticketTypeId: order.ticketTypeId,// Link it to the specific tier (e.g., VIP)
    qrCode: uniqueQrString,          // The secure string we just generated
    status: 'valid'                  // Ready to be scanned at the door!
  });

  // Log the success for our server monitoring
  logger.info(`Payment successful! Ticket ${finalTicket._id} generated for Order ${order._id}`);

  // Return the ticket back to the controller
  return finalTicket;
};