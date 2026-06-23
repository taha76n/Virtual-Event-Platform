import express from 'express';
import { checkout, safepayWebhook } from './controllers/ticketingController.js';
import { requireAuth } from '../auth/index.js'; // From Auth Module interface

const router = express.Router();

// Protected route: User must be logged in to reserve a ticket
router.post('/checkout', requireAuth, checkout);

// Public route: Must be public so Safepay's external servers can reach it.
// We secure it internally using the cryptographic signature check in the controller.
router.post('/webhook/safepay', safepayWebhook);

export default router;