// server/src/routes/submissions.routes.js
// CRUD routes for submissions — all data access goes through the backend.

const { Router } = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validateRequest");
const {
  create,
  updateResult,
  updateScreenshot,
  getById,
} = require("../controllers/submissions.controller");

const router = Router();

// ── UUID format check (reused across routes) ──────────────────────
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUuidParam(req, res, next) {
  if (!uuidRegex.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid submission ID format (expected UUID)" });
  }
  next();
}

// ── Schemas ────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional(),
  phoneFull: z.string().trim().optional(),
  countryCode: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  role: z.string().trim().optional(),
  website: z.string().trim().optional(),
  linkedin: z.string().trim().optional(),
  teamSize: z.string().trim().optional(),
  productName: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  geography: z.string().trim().optional(),
  problem: z.string().trim().optional(),
  stage: z.string().trim().optional(),
}).passthrough();

const updateResultSchema = z.object({
  answers: z.record(z.any()).default({}),
  result: z.record(z.any()).default({}),
});

// Screenshot data URL: must start with data:image/...;base64, and be ≤ 5MB
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5MB in characters (base64 is ~4/3x raw)
const screenshotSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/[a-zA-Z+]+;base64,/, "dataUrl must be a valid base64 data:image URI")
    .refine(
      (val) => val.length <= MAX_SCREENSHOT_SIZE,
      `Screenshot data URL must be ≤ 5MB`
    ),
});

// ── Routes ─────────────────────────────────────────────────────────

// POST /api/submissions
router.post("/", validate(createSchema), create);

// PATCH /api/submissions/:id/result
router.patch("/:id/result", validateUuidParam, validate(updateResultSchema), updateResult);

// PATCH /api/submissions/:id/screenshot
router.patch("/:id/screenshot", validateUuidParam, validate(screenshotSchema), updateScreenshot);

// GET /api/submissions/:id
router.get("/:id", validateUuidParam, getById);

module.exports = router;
