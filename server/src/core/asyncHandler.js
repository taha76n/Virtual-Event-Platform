// Exporting a function named 'asyncHandler' that takes another function ('fn') as its argument.
// This is called a "Higher-Order Function" in JavaScript.
export const asyncHandler = (fn) => {
  // We return a new anonymous function that Express will use as the actual middleware.
  // Express always provides 'req' (request), 'res' (response), and 'next' (function to move to the next step).
  return (req, res, next) => {
    // Promise.resolve() takes the execution of our controller function 'fn'.
    // If 'fn' is successful, it does nothing and the response is sent.
    // If 'fn' throws an error, the '.catch(next)' automatically catches it and passes it to our Global Error Handler.
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
