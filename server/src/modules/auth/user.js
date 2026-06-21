const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  avatarUrl: { type: String },
  oauthProvider: { type: String, enum: ['google', 'github'], required: true },
  oauthId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'organizer', 'attendee'], default: 'attendee' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' }
}, { 
  timestamps: true 
});

// Compound index for fast OAuth lookups
userSchema.index({ oauthProvider: 1, oauthId: 1 });