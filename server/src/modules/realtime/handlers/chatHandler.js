import ChatMessage from '../models/ChatMessage.js';
import { socketAsyncWrapper } from '../../../core/asyncHandler.js';
import logger from '../../../core/logger.js';

// Export a function that sets up all the chat-related event listeners for a specific user's socket
export const registerChatHandlers = (io, socket) => {
  
  // Listen for a 'join_event_room' event sent by the React frontend
  // We wrap the logic in 'socketAsyncWrapper' to automatically catch any crashes
  socket.on('join_event_room', socketAsyncWrapper(socket, async (payload) => {
    // Extract the event ID from the payload sent by the frontend
    const { eventId } = payload;

    // Use Socket.io's built in 'join' method to subscribe this user to a specific "room"
    // Think of a room like a WhatsApp group chat.
    socket.join(`event_${eventId}`);
    logger.debug(`User ${socket.user.id} joined room: event_${eventId}`);

    // (Optional) We could emit a "User joined" message to everyone else in the room here, 
    // but in large events with 10,000 people, joining messages create too much spam.
  }));

  // Listen for a 'send_chat_message' event sent by the React frontend
  socket.on('send_chat_message', socketAsyncWrapper(socket, async (payload) => {
    // Destructure the required data from the payload
    // Notice we do NOT trust the frontend to send the senderId. We pull it securely from 'socket.user.id'
    const { eventId, text, senderName, senderAvatar } = payload;

    // Validation: Ensure the message is not empty or just spaces
    if (!text || text.trim() === '') {
      throw new Error('Message cannot be empty');
    }

    // Step 1: Save the message to the MongoDB database so it persists for future attendees
    const savedMessage = await ChatMessage.create({
      eventId,
      senderId: socket.user.id, // Securely injected from our JWT middleware
      senderName,
      senderAvatar,
      text
    });

    // Step 2: Broadcast the message to EVERYONE currently in the event's room.
    // 'io.to(roomName).emit' is the magic of WebSockets. It instantly pushes the data to thousands of clients.
    io.to(`event_${eventId}`).emit('new_chat_message', {
      _id: savedMessage._id,
      eventId: savedMessage.eventId,
      senderId: savedMessage.senderId,
      senderName: savedMessage.senderName,
      senderAvatar: savedMessage.senderAvatar,
      text: savedMessage.text,
      createdAt: savedMessage.createdAt
    });

    logger.debug(`Message broadcasted in event_${eventId} by user ${socket.user.id}`);
  }));
};