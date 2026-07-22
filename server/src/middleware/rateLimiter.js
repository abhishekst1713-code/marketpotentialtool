// server/src/middleware/rateLimiter.js
// Rate limiting middleware using express-rate-limit.
// Provides a global limiter and a stricter one for the analysis endpoint.

const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");

// Global rate limiter — applies to all routes
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Stricter limiter for /api/analysis (expensive Gemini calls)
// 5 requests per 60 seconds per IP
const analysisLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Analysis rate limit exceeded. Please wait before trying again." },
});

module.exports = { globalLimiter, analysisLimiter };
