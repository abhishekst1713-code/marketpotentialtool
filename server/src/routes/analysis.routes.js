// server/src/routes/analysis.routes.js
// POST /api/analysis — validates body, rate-limited, calls Gemini.

const { Router } = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validateRequest");
const { analysisLimiter } = require("../middleware/rateLimiter");
const { analyze } = require("../controllers/analysis.controller");

const router = Router();

// Validation schema — userData must include organization, sector, geography
const analysisSchema = z.object({
  userData: z.object({
    organization: z.string().min(1, "organization is required"),
    sector: z.string().min(1, "sector is required"),
    geography: z.string().min(1, "geography is required"),
    role: z.string().optional().default(""),
    stage: z.string().optional().default(""),
    problem: z.string().optional().default(""),
    productName: z.string().optional().default(""),
    businessType: z.string().optional().default(""),
  }).passthrough(),   // allow extra fields the frontend may send
  answers: z.record(z.any()).default({}),
});

router.post("/", analysisLimiter, validate(analysisSchema), analyze);

module.exports = router;
