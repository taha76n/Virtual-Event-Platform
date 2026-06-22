import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String },
  bannerUrl: { type: String },
  startsAt: { type: Date, required: true, index: true },
  endsAt: { type: Date, required: true },
  timezone: { type: String, required: true, default: 'UTC' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
  status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft', index: true },
  features: {
    chat: { type: Boolean, default: true },
    qa: { type: Boolean, default: true },
    polls: { type: Boolean, default: true }
  },
  capacity: { type: Number, default: 0 }, // 0 means unlimited

  // Notice: We do NOT use `ref: 'User'` here. 
  // This enforces Modular Monolith strict isolation rule.
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true }
}, {
  timestamps: true
});

export const Event = mongoose.model('Event', eventSchema);