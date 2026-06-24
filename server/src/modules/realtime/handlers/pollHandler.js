// Import the Poll database model we just created
import Poll from '../models/Poll.js';
// Import our wrapper to catch any asynchronous crashes gracefully
import { socketAsyncWrapper } from '../../../core/asyncHandler.js';
import logger from '../../../core/logger.js';

/**
 * Real-time Handlers for Live Polls
 */
export const registerPollHandlers = (io, socket) => {
  
  // 1. CREATE A NEW POLL (Organizer Only)
  socket.on('create_poll', socketAsyncWrapper(socket, async (payload) => {
    const { eventId, question, options } = payload;

    // Security Check: Only organizers/admins should be able to create a poll
    if (socket.user.role !== 'organizer' && socket.user.role !== 'admin') {
      throw new Error('Unauthorized: Only organizers can create polls');
    }

    // Step 1: Format the options array properly for MongoDB
    const formattedOptions = options.map(opt => ({ text: opt, votes: 0 }));

    // Step 2: Save the new poll to the database
    const newPoll = await Poll.create({
      eventId,
      question,
      options: formattedOptions,
      createdBy: socket.user.id
    });

    // Step 3: Broadcast the new poll to EVERYONE in the event room instantly
    // The React frontend will listen for 'new_poll' and pop up a voting modal
    io.to(`event_${eventId}`).emit('new_poll', {
      _id: newPoll._id,
      question: newPoll.question,
      options: newPoll.options
    });

    logger.debug(`New poll created for event_${eventId} by user ${socket.user.id}`);
  }));

  // 2. SUBMIT A VOTE (Attendees)
  socket.on('submit_vote', socketAsyncWrapper(socket, async (payload) => {
    const { eventId, pollId, optionId } = payload;
    const userId = socket.user.id; // Pulled securely from the JWT token, NOT the frontend!

    // Step 1: Find the poll in the database
    const poll = await Poll.findById(pollId);
    
    if (!poll) throw new Error('Poll not found');
    if (!poll.isActive) throw new Error('This poll is no longer accepting votes');

    // Step 2: THE DOUBLE-VOTE CHECK
    // We check if the user's ID is already in the 'votedUsers' array
    if (poll.votedUsers.includes(userId)) {
      // If they already voted, we throw an error. 
      // Our socketAsyncWrapper will catch this and send a red error toast ONLY to this user.
      throw new Error('You have already voted in this poll');
    }

    // Step 3: ATOMIC UPDATE
    // We update the database. We use the positional operator ($) to increment 
    // the specific option they chose, and we push their ID into the votedUsers array.
    const updatedPoll = await Poll.findOneAndUpdate(
      { _id: pollId, "options._id": optionId }, // Find the poll AND the specific option
      { 
        $inc: { "options.$.votes": 1 },         // Add 1 vote to that specific option
        $push: { votedUsers: userId }           // Add the user to the "already voted" list
      },
      { new: true } // Return the updated document
    );

    // Step 4: BROADCAST THE LIVE RESULTS
    // We send the updated vote counts to everyone in the room so the charts update in real-time!
    // Notice we DO NOT send the 'votedUsers' array to the frontend to protect user privacy.
    io.to(`event_${eventId}`).emit('poll_updated', {
      _id: updatedPoll._id,
      options: updatedPoll.options
    });
  }));

};