import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  // Tracks belong to an Event. Since both are in the Catalog module, `ref` is allowed here.
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true }
}, { 
  timestamps: true 
});

export const Track = mongoose.model('Track', trackSchema);