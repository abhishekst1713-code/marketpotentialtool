// server/src/routes/submissions.routes.js
// CRUD routes for submissions — all data access goes through the backend.

const { Router } = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validateRequest");
const {
  create,
  updateResult,
  updateScreenshot,
  updateReportPdf,
  getById,
} = require("../controllers/submissions.controller");

// ── Nonsense / gibberish detectors (server-side guard) ────────────
function looksJunkName(raw) {
  const s = String(raw || "").trim();
  if (!s) return false; // emptiness handled by required checks
  const compact = s.replace(/\s+/g, "");
  const letters = (compact.match(/[a-zA-Z]/g) || []).length;
  if (letters < 2) return true;
  if (/^(.)\1+$/.test(compact)) return true;               // xxxx, aaaa
  const uniq = new Set(compact.toLowerCase()).size;
  if (compact.length >= 8 && uniq <= 2) return true;       // asdasdasd
  const vowels = (compact.match(/[aeiouAEIOU]/g) || []).length;
  if (letters >= 10 && vowels / letters < 0.1) return true; // keyboard mash
  return false;
}

function looksGibberishText(raw) {
  const s = String(raw || "").trim();
  if (!s) return true;
  const compact = s.replace(/\s+/g, "");
  if (/^(.)\1+$/.test(compact)) return true;               // SSSS…
  const uniq = new Set(compact.toLowerCase()).size;
  if (compact.length >= 12 && uniq <= 3) return true;
  const words = s.match(/[a-zA-Z]{2,}/g) || [];
  if (words.length < 3) return true;
  const letters = (s.match(/[a-zA-Z]/g) || []).length;
  const vowels = (s.match(/[aeiouAEIOU]/g) || []).length;
  if (letters >= 12 && vowels / letters < 0.15) return true;
  if (compact.length >= 15 && !/\s/.test(s) && uniq / compact.length < 0.3) return true;
  return false;
}

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
  name: z.string().trim().min(1, "name is required")
    .refine((v) => !looksJunkName(v), "Please enter a valid name."),
  email: z.string().trim().email("Invalid email address")
    .refine((v) => !/\.\./.test(v), "Invalid email address")
    .refine((v) => !/^[.\-]|[.\-]@|@[.\-]|[.\-]$/.test(v), "Invalid email address"),
  phone: z.string().trim().optional(),
  phoneFull: z.string().trim().optional(),
  countryCode: z.string().trim().optional(),
  organization: z.string().trim().optional()
    .refine((v) => !v || !looksJunkName(v), "Please enter a valid organization name."),
  role: z.string().trim().optional(),
  website: z.string().trim().optional(),
  linkedin: z.string().trim().optional(),
  teamSize: z.string().trim().optional(),
  productName: z.string().trim().optional()
    .refine((v) => !v || !looksJunkName(v), "Please enter a valid product name."),
  businessType: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  geography: z.string().trim().optional(),
  problem: z.string().trim().optional()
    .refine((v) => !v || v.length >= 20, "Problem must be at least 20 characters.")
    .refine((v) => !v || !looksGibberishText(v), "Nonsensical or test input detected in problem description."),
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

// Report PDF data URL: must start with data:application/pdf;base64, and be ≤ 15MB
const MAX_REPORT_PDF_SIZE = 15 * 1024 * 1024; // 15MB in characters (base64 is ~4/3x raw)
const reportPdfSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:application\/pdf;base64,/, "dataUrl must be a valid base64 data:application/pdf URI")
    .refine(
      (val) => val.length <= MAX_REPORT_PDF_SIZE,
      `Report PDF data URL must be ≤ 15MB`
    ),
});

// ── Routes ─────────────────────────────────────────────────────────

// POST /api/submissions
router.post("/", validate(createSchema), create);

// PATCH /api/submissions/:id/result
router.patch("/:id/result", validateUuidParam, validate(updateResultSchema), updateResult);

// PATCH /api/submissions/:id/screenshot
router.patch("/:id/screenshot", validateUuidParam, validate(screenshotSchema), updateScreenshot);

// PATCH /api/submissions/:id/report-pdf
router.patch("/:id/report-pdf", validateUuidParam, validate(reportPdfSchema), updateReportPdf);

// GET /api/submissions/:id
router.get("/:id", validateUuidParam, getById);

module.exports = router;
