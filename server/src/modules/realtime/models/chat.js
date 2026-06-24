import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  // We index this so fetching all messages for a specific event room is lightning fast.
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  
  // The ID of the user who sent the message.
  // Note: We avoid ref: 'User' to maintain our strict Modular Monolith boundaries!
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  // We store the sender's name and avatar directly in the message document.
  // This is a NoSQL optimization called "Denormalization". It saves us from making 
  // secondary database queries to the Auth module every time someone sends a chat.
  senderName: { type: String, required: true },
  senderAvatar: { type: String },
  
  // The actual text content of the message
  text: { type: String, required: true },
  
  // A boolean to flag if a message was deleted by a moderator
  isDeleted: { type: Boolean, default: false }
}, { 
  // Automatically adds 'createdAt' and 'updatedAt' timestamps to every message
  timestamps: true 
});

// Export the compiled Mongoose model so we can use it to create/read messages
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);