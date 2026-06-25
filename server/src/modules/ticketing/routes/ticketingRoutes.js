import express from 'express';
import { requireAuth } from '../../auth/index.js';
import { checkout, safepayWebhook } from '../controllers/ticketingController.js';

const router = express.Router();

// Protected route: User must be logged in to reserve a ticket
router.post('/checkout', requireAuth, checkout);

// Public route: Must be public so Safepay's external servers can reach it.
// We secure it internally using the cryptographic signature check in the controller.
router.post('/webhook/safepay', safepayWebhook);

export default router;