// server/src/config/env.js
// Loads and validates environment variables at boot.
// Throws and exits if required vars are missing — no silent fallback.

const { z } = require("zod");

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  GEMINI_API_KEY: z
    .string({ required_error: "GEMINI_API_KEY is required" })
    .min(1, "GEMINI_API_KEY must not be empty"),
  GEMINI_MODEL_FAST: z.string().default("gemini-2.5-flash"),
  GEMINI_MODEL_SMART: z.string().default("gemini-2.5-flash"),

  SUPABASE_URL: z
    .string({ required_error: "SUPABASE_URL is required" })
    .url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ required_error: "SUPABASE_SERVICE_ROLE_KEY is required" })
    .min(1, "SUPABASE_SERVICE_ROLE_KEY must not be empty"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(20),

  // ── Razorpay ────────────────────────────────────────────────────
  // Payment gateway is temporarily disabled (unlock is free/instant), so
  // these are optional for now. Set them when re-enabling checkout —
  // create-order/payment-status will still fail without real values, but
  // the server no longer refuses to boot without them.
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),

  // ── Redirect URLs ───────────────────────────────────────────────
  // Public URL of this app — used to redirect back after payment
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  // Full base URL of the external Payment Hub (including query string prefix)
  PAYMENT_HUB_URL: z
    .string()
    .default("https://payment-t1ag.onrender.com/?app_id=cofit"),
});

let env;

try {
  env = envSchema.parse(process.env);
} catch (err) {
  console.error("\n❌  Environment validation failed:\n");
  if (err.errors) {
    err.errors.forEach((e) => {
      console.error(`   • ${e.path.join(".")}: ${e.message}`);
    });
  } else {
    console.error(err.message);
  }
  console.error("\n   Copy server/.env.example to server/.env and fill in the required values.\n");
  process.exit(1);
}

module.exports = { env };
