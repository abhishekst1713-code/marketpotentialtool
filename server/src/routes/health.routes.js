// server/src/routes/health.routes.js
// GET /api/health — simple uptime check with config status.

const { Router } = require("express");
const { env } = require("../config/env");

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: Boolean(env.GEMINI_API_KEY),
    supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  });
});

module.exports = router;
