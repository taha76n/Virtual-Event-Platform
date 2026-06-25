import mongoose from 'mongoose';

// The final Ticket is ONLY generated when an Order becomes 'paid'
const ticketSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  qrCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['valid', 'scanned', 'cancelled'], default: 'valid' }
}, {
  timestamps: true
});

export const Ticket = mongoose.model('Ticket', ticketSchema);