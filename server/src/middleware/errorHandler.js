// server/src/middleware/errorHandler.js
// Centralized error handler — catches all errors from routes and middleware.
// Never leaks stack traces in production.

function errorHandler(err, req, res, _next) {
  // Default to 500 unless the error has a statusCode set
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Always log the full error server-side
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${statusCode}`);
  console.error(err.stack || err.message || err);

  const response = {
    error: err.message || "Internal Server Error",
  };

  // Include stack trace only in development
  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = { errorHandler };
