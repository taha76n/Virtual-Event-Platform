import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Strictly isolated: NO ref: 'User'
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  // Safe to ref here because TicketType lives inside the same Ticketing module
  ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'expired', 'refunded'], 
    default: 'pending',
    index: true
  },
  expiresAt: { type: Date, required: true },
  safepaySessionId: { type: String }
}, { 
  timestamps: true 
});

export const Order = mongoose.model('Order', orderSchema);