// server/src/middleware/requestLogger.js
// HTTP request logging using Morgan.

const morgan = require("morgan");

// Use 'dev' format in development (colored, concise), 'combined' in production
const requestLogger = morgan(
  process.env.NODE_ENV === "production" ? "combined" : "dev"
);

module.exports = { requestLogger };
