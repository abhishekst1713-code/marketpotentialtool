// server/src/index.js
// Application entry point — loads env, starts HTTP server.

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// env.js validates environment variables and will process.exit(1) if missing
const { env } = require("./config/env");
const app = require("./app");

const server = app.listen(env.PORT, () => {
  const geminiOk = Boolean(env.GEMINI_API_KEY);
  const supabaseOk = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("");
  console.log("  MarketPotential — Express Backend");
  console.log("  ─────────────────────────────────────");
  console.log(`  🌐  http://localhost:${env.PORT}`);
  console.log(`  🔑  Gemini:   ${geminiOk ? "✅ Configured" : "❌ NOT SET"}`);
  console.log(`  🗄️   Supabase: ${supabaseOk ? "✅ Configured" : "❌ NOT SET"}`);
  console.log(`  🌍  CORS:     ${env.CORS_ORIGIN}`);
  console.log(`  📦  ENV:      ${env.NODE_ENV}`);
  console.log("  ─────────────────────────────────────");
  console.log("");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("  SIGTERM received, shutting down…");
  server.close(() => process.exit(0));
});
