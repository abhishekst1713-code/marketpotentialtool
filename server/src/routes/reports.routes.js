// server/src/routes/reports.routes.js
// POST /api/reports/unlock — validate, unlock report, capture lead.

const { Router } = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validateRequest");
const { unlock } = require("../controllers/reports.controller");

const router = Router();

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const unlockSchema = z.object({
  submissionId: z
    .string()
    .regex(uuidRegex, "submissionId must be a valid UUID"),
  email: z
    .string()
    .trim()
    .email("Invalid email address"),
  name: z
    .string()
    .trim()
    .optional(),
});

router.post("/unlock", validate(unlockSchema), unlock);

module.exports = router;
