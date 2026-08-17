// server/src/controllers/submissions.controller.js
// CRUD operations for the submissions table, all via supabase.service.js.

const {
  insertSubmission,
  updateSubmissionResult,
  updateSubmissionScreenshot,
  updateSubmissionReportPdf,
  getSubmissionById,
} = require("../services/supabase.service");
const { asyncHandler } = require("../utils/asyncHandler");

// POST /api/submissions
const create = asyncHandler(async (req, res) => {
  const { id } = await insertSubmission(req.body);
  res.status(201).json({ id });
});

// PATCH /api/submissions/:id/result
const updateResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answers, result } = req.body;

  await updateSubmissionResult(id, answers, result);
  res.json({ id, status: "assessment_complete" });
});

// PATCH /api/submissions/:id/screenshot
const updateScreenshot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dataUrl } = req.body;

  await updateSubmissionScreenshot(id, dataUrl);
  res.json({ id, status: "screenshot_saved" });
});

// PATCH /api/submissions/:id/report-pdf
const updateReportPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dataUrl } = req.body;

  const { reportPdfUrl } = await updateSubmissionReportPdf(id, dataUrl);
  res.json({ id, status: "report_pdf_saved", reportPdfUrl });
});

// GET /api/submissions/:id
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await getSubmissionById(id);
  res.json(submission);
});

module.exports = { create, updateResult, updateScreenshot, updateReportPdf, getById };
