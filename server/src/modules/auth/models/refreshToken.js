import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  deviceInfo: { 
    type: String 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  }
}, { 
  timestamps: true 
});

// MongoDB TTL Index: This automatically deletes the document when the current time hits `expiresAt`
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);