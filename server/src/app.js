// server/src/app.js
// Express application — wires all middleware and routes.

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { env } = require("./config/env");
const { globalLimiter } = require("./middleware/rateLimiter");
const { requestLogger } = require("./middleware/requestLogger");
const { errorHandler } = require("./middleware/errorHandler");

// Route modules
const healthRoutes = require("./routes/health.routes");
const analysisRoutes = require("./routes/analysis.routes");
const submissionsRoutes = require("./routes/submissions.routes");
const reportsRoutes = require("./routes/reports.routes");

const app = express();

// ── Security headers ───────────────────────────────────────────────
app.use(helmet());

// ── CORS — restricted to the configured origin ────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ── Body parsing — 6MB limit for base64 screenshots ───────────────
app.use(express.json({ limit: "6mb" }));

// ── Request logging ───────────────────────────────────────────────
app.use(requestLogger);

// ── Global rate limiter ───────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/reports", reportsRoutes);

// ── Serve frontend static assets ──────────────────────────────────
app.use(express.static(path.join(__dirname, "../../dist")));

// ── Fallback handler for client routing (non-API routes) ──────────
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

// ── Centralized error handler (must be last) ──────────────────────
app.use(errorHandler);

module.exports = app;
