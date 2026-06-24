
// It takes the specific user's 'socket' connection, and the function 'fn' we want to run.
export const socketAsyncWrapper = (socket, fn) => {
  // It returns an asynchronous function that gathers any number of arguments using the spread operator (...args).
  // In Socket.io, these arguments are usually the data the user sent, and sometimes a callback.
  return async (...args) => {
    // We execute the function inside Promise.resolve() to catch any async errors.
    Promise.resolve(fn(...args)).catch((err) => {
      // If an error happens (e.g., database fails), we don't crash the server.
      // Instead, we use 'socket.emit' to send a custom 'error' event ONLY back to the user who caused it.
      socket.emit('error', { success: false, message: err.message || 'Realtime server error' });
    });
  };
};