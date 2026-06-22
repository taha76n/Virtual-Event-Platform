import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  abstract: { type: String },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', index: true }, // Optional
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  capacity: { type: Number, default: 0 },
  streamProvider: { type: String, enum: ['youtube', 'mux', 'webrtc'], required: true },
  playbackUrl: { type: String },
  recordingUrl: { type: String }
}, { 
  timestamps: true 
});

// Create a compound index so we can quickly fetch the schedule for a specific event ordered by time
sessionSchema.index({ eventId: 1, startsAt: 1 });

export const Session = mongoose.model('Session', sessionSchema);