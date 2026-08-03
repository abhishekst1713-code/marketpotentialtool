// server/src/routes/payment.routes.js
// Payment-related routes:
//   POST /api/payments/create-order   — create a Razorpay order, return orderId + keyId
//   GET  /payment-status              — verify signature, update DB, redirect to frontend
//
// Note: /payment-status is mounted at the ROOT level in app.js (not under /api/)
// because the Payment Hub redirects users to it as a full browser navigation.

const { Router } = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validateRequest");
const { createOrder, paymentStatus } = require("../controllers/payment.controller");

const router = Router();

// ── UUID format check ─────────────────────────────────────────────────────────
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Schema for create-order ───────────────────────────────────────────────────
const createOrderSchema = z.object({
  submissionId: z
    .string()
    .regex(uuidRegex, "submissionId must be a valid UUID"),
  amount: z
    .number({ required_error: "amount (in paise) is required" })
    .int("amount must be an integer (paise)")
    .min(1, "amount must be at least 1 paise"),
  currency: z.enum(["INR", "USD", "EUR"]).default("INR"),
});

// POST /api/payments/create-order
router.post("/create-order", validate(createOrderSchema), createOrder);

// GET /payment-status
// This is also exported for mounting at root level in app.js
router.get("/status", paymentStatus);

module.exports = router;
module.exports.paymentStatus = paymentStatus; // named export for root-level mount
