import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  // The event this poll belongs to (Indexed for fast lookups in large rooms)
  eventId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  
  // The question being asked (e.g., "What is your favorite frontend framework?")
  question: { type: String, required: true },
  
  // The possible answers. We use an array of objects so each option gets its own unique _id
  options: [{
    text: { type: String, required: true },
    votes: { type: Number, default: 0 } // Defaults to 0 votes
  }],
  
  // CRITICAL: We store an array of User IDs who have already voted.
  // This prevents the same attendee from clicking "Vote" 100 times and ruining the poll.
  votedUsers: [{ type: mongoose.Schema.Types.ObjectId }],
  
  // Is the poll currently accepting votes?
  isActive: { type: Boolean, default: true },
  
  // The Organizer who created the poll
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { 
  timestamps: true 
});

default const Poll = mongoose.model('Poll', pollSchema);