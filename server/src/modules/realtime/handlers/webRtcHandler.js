// Import the custom error wrapper we built to catch async errors
import { socketAsyncWrapper } from '../../../core/asyncHandler.js';
import logger from '../../../core/logger.js';

/**
 * WebRTC Signaling Server Logic
 * This file DOES NOT handle video data. It only handles the text-based 
 * handshake (Signaling) required for two browsers to find each other.
 */
export const registerWebRTCHandlers = (io, socket) => {
  
  // 1. JOIN STREAM ROOM
  // Fired when a user enters a specific session's live stream page
  socket.on('join_stream', socketAsyncWrapper(socket, async ({ sessionId }) => {
    const room = `stream_${sessionId}`;
    socket.join(room);
    logger.debug(`User ${socket.user.id} joined stream room: ${room}`);

    // Tell everyone ELSE in the room that a new peer has arrived.
    // The broadcaster listens for this 'peer_joined' event so they know 
    // to initiate a new WebRTC connection (Offer) with this specific user.
    socket.to(room).emit('peer_joined', { 
      peerId: socket.id, // Socket IDs act as unique network identifiers for WebRTC
      userId: socket.user.id 
    });
  }));

  // 2. RELAY WEBRTC OFFER (Broadcaster -> Viewer)
  // SDP = Session Description Protocol (Contains video/audio capabilities)
  socket.on('webrtc_offer', socketAsyncWrapper(socket, async ({ targetPeerId, sdp }) => {
    // We do NOT broadcast this to the whole room. We route it strictly
    // to the specific target peer (the viewer) using io.to(targetPeerId).
    io.to(targetPeerId).emit('webrtc_offer', {
      senderPeerId: socket.id, // Tell the viewer who the offer is from
      sdp
    });
    logger.debug(`Relayed WebRTC Offer from ${socket.id} to ${targetPeerId}`);
  }));

  // 3. RELAY WEBRTC ANSWER (Viewer -> Broadcaster)
  // The viewer accepts the offer and sends their own capabilities back
  socket.on('webrtc_answer', socketAsyncWrapper(socket, async ({ targetPeerId, sdp }) => {
    io.to(targetPeerId).emit('webrtc_answer', {
      senderPeerId: socket.id,
      sdp
    });
    logger.debug(`Relayed WebRTC Answer from ${socket.id} to ${targetPeerId}`);
  }));

  // 4. RELAY ICE CANDIDATES
  // ICE (Interactive Connectivity Establishment) handles NAT traversal (punching through firewalls).
  // Both peers generate multiple ICE candidates and send them to each other via our server.
  socket.on('webrtc_ice_candidate', socketAsyncWrapper(socket, async ({ targetPeerId, candidate }) => {
    io.to(targetPeerId).emit('webrtc_ice_candidate', {
      senderPeerId: socket.id,
      candidate
    });
  }));

  // 5. HANDLE DISCONNECTIONS
  // If a viewer closes their laptop or loses WiFi, we need to tell the broadcaster 
  // so the broadcaster can close that specific P2P connection and free up RAM.
  socket.on('disconnect', () => {
    // socket.broadcast.emit sends the message to EVERYONE connected to the server EXCEPT the sender.
    // The frontend WebRTC logic will check if they were connected to this peerId and clean up.
    socket.broadcast.emit('peer_left', { peerId: socket.id });
  });
};