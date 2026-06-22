import mongoose from 'mongoose';

// This is the join collection requested in the project overview.
// It allows one speaker to be in many sessions, and one session to have many speakers.
const sessionSpeakerSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  speakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Speaker', required: true, index: true },
  role: { type: String, default: 'speaker' } // Useful if we want 'moderator' vs 'panelist' later
}, { 
  timestamps: true 
});

// Ensure a speaker can't be added to the exact same session twice
sessionSpeakerSchema.index({ sessionId: 1, speakerId: 1 }, { unique: true });

export const SessionSpeaker = mongoose.model('SessionSpeaker', sessionSpeakerSchema);