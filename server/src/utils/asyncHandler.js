// server/src/utils/asyncHandler.js
// Wraps async route handlers so they don't need try/catch boilerplate.
// Any rejected promise is forwarded to the centralized error handler.

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
