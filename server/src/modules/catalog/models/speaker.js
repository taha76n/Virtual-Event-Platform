import mongoose from 'mongoose';

const speakerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String }, // Optional, kept private for organizers to contact them
  bio: { type: String },
  avatarUrl: { type: String },
  linkedInUrl: { type: String }
}, { 
  timestamps: true 
});

export const Speaker = mongoose.model('Speaker', speakerSchema);