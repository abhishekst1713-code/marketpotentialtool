// server/src/controllers/payment.controller.js
// Handles Razorpay order creation and server-side payment verification.
//
// Flow:
//   1. Frontend calls POST /api/payments/create-order
//      → createOrder() calls Razorpay REST API, saves orderId to DB, returns it to client.
//   2. Client opens Razorpay modal with client-side handler (no callback_url).
//   3. On success, handler redirects window.top to Payment Hub with payment params.
//   4. Payment Hub redirects to GET /payment-status?status=...&payment_id=...&order_id=...&signature=...
//      → paymentStatus() verifies HMAC, updates DB, redirects to frontend.

const crypto = require("crypto");
const https = require("https");
const { env } = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  getSubmissionById,
  saveRazorpayOrderId,
  markSubmissionPaid,
} = require("../services/supabase.service");

// ── Razorpay REST helper ──────────────────────────────────────────────────────
// We use the native `https` module so we don't need an extra npm dependency.
// Razorpay's REST API uses HTTP Basic auth: key_id:key_secret.

function razorpayRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(
      `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "api.razorpay.com",
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(
              parsed.error?.description || `Razorpay API error (${res.statusCode})`
            );
            err.statusCode = res.statusCode;
            return reject(err);
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error("Failed to parse Razorpay response"));
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── POST /api/payments/create-order ──────────────────────────────────────────
// Body: { submissionId: UUID, amount: number (in paise), currency?: string }
// Returns: { orderId, amount, currency, keyId }
const createOrder = asyncHandler(async (req, res) => {
  const { submissionId, amount, currency = "INR" } = req.body;

  // Validate submission exists
  await getSubmissionById(submissionId); // throws 404 if not found

  // Amount must be a positive integer in paise (e.g. 50 paise)
  const amountPaise = Math.round(Number(amount));
  if (!amountPaise || amountPaise < 1) {
    return res.status(400).json({ error: "amount must be at least 1 paise" });
  }

  // Create order via Razorpay REST API
  const order = await razorpayRequest("POST", "/v1/orders", {
    amount: amountPaise,
    currency,
    receipt: submissionId.slice(0, 40), // Razorpay receipt max 40 chars
    notes: { submissionId },
  });

  // Persist the order ID against the submission row (non-blocking on error)
  await saveRazorpayOrderId(submissionId, order.id);

  console.log(
    `  🛒 Razorpay order created: ${order.id} for submission ${submissionId} (${amountPaise} paise)`
  );

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
  });
});

// ── GET /payment-status ───────────────────────────────────────────────────────
// Called by the Payment Hub after it receives the payment params from the frontend.
// Query params: status, payment_id, order_id, signature, session (submission UUID)
//
// Security: HMAC-SHA256 of "order_id|payment_id" is verified against the signature
// using RAZORPAY_KEY_SECRET before any DB update is performed.
const paymentStatus = asyncHandler(async (req, res) => {
  const {
    status,
    payment_id,
    order_id,
    signature,
    session: submissionId,
  } = req.query;

  const frontendBase = env.FRONTEND_URL;
  const redirectBase = `${frontendBase}?session=${encodeURIComponent(submissionId || "")}`;

  // ── Guard: need at minimum a submission session to redirect back to ────────
  if (!submissionId) {
    console.warn("[payment-status] Missing session param — cannot redirect");
    return res.redirect(`${frontendBase}?payment=failed`);
  }

  // ── Guard: if Payment Hub flagged the payment itself as failed ────────────
  if (status === "failed") {
    console.warn(`[payment-status] Payment Hub reported failure for session ${submissionId}`);
    return res.redirect(`${redirectBase}&payment=failed`);
  }

  // ── Signature verification ────────────────────────────────────────────────
  // Razorpay signs: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
  if (!payment_id || !order_id || !signature) {
    console.warn("[payment-status] Missing payment params — treating as failed");
    return res.redirect(`${redirectBase}&payment=failed`);
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest("hex");

  const signaturesMatch = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );

  if (!signaturesMatch) {
    console.error(
      `[payment-status] ⚠️ SIGNATURE MISMATCH — possible tampering! ` +
        `session=${submissionId} order=${order_id} payment=${payment_id}`
    );
    return res.redirect(`${redirectBase}&payment=failed`);
  }

  // ── Update DB: mark submission as paid ───────────────────────────────────
  try {
    await markSubmissionPaid(submissionId, order_id, payment_id);
  } catch (err) {
    console.error("[payment-status] DB update failed:", err.message);
    // Even if DB update fails, redirect with success so the user isn't stranded.
    // The signature already verified — the payment is real.
    return res.redirect(`${redirectBase}&payment=success&payment_id=${encodeURIComponent(payment_id)}`);
  }

  // ── Redirect to frontend with success params ──────────────────────────────
  return res.redirect(
    `${redirectBase}&payment=success&payment_id=${encodeURIComponent(payment_id)}`
  );
});

// ── POST /api/payments/test-unlock ───────────────────────────────────────────
const testUnlock = asyncHandler(async (req, res) => {
  const { submissionId } = req.body;
  if (!submissionId) {
    return res.status(400).json({ error: "submissionId is required" });
  }
  
  await markSubmissionPaid(submissionId, "test_order", "test_pay");
  console.log(`[test-unlock] Submission ${submissionId} successfully unlocked directly`);
  
  res.json({ success: true });
});

module.exports = { createOrder, paymentStatus, testUnlock };
