import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema({
  // Strictly isolated: NO ref: 'Event' to maintain Modular Monolith boundaries
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  capacity: { type: Number, required: true },
  soldCount: { type: Number, default: 0 },
  lockedCount: { type: Number, default: 0 },
  saleWindowStart: { type: Date },
  saleWindowEnd: { type: Date }
}, {
  timestamps: true
});

export const TicketType = mongoose.model('TicketType', ticketTypeSchema);