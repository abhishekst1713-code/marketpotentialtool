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
const paymentRoutes = require("./routes/payment.routes");
const { paymentStatus } = require("./controllers/payment.controller");

const app = express();

// ── Security headers ───────────────────────────────────────────────
app.use(helmet());

// ── CORS — restricted to the configured origins ───────────────────
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ── Body parsing — 20MB limit to fit base64 screenshots + PDF reports ──
app.use(express.json({ limit: "20mb" }));

// ── Request logging ───────────────────────────────────────────────
app.use(requestLogger);

// ── Global rate limiter ───────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/payments", paymentRoutes);

// ── Payment Hub callback — top-level, NOT under /api/ ─────────────────────
// The Payment Hub redirects the browser here after displaying the receipt.
// Must be registered before the static-file catch-all below.
app.get("/payment-status", paymentStatus);

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
