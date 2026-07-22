// server/src/controllers/reports.controller.js
// Handles POST /api/reports/unlock — unlocks full report, saves lead, uploads to storage.

const {
  getSubmissionById,
  uploadReportToStorage,
  insertReportAccess,
} = require("../services/supabase.service");
const { asyncHandler } = require("../utils/asyncHandler");

const unlock = asyncHandler(async (req, res) => {
  const { submissionId, email, name } = req.body;

  // 1. Fetch the submission and its analysis
  const submission = await getSubmissionById(submissionId);

  const analysisJson = submission.analysis_json;
  if (!analysisJson || Object.keys(analysisJson).length === 0) {
    const err = new Error("No analysis data found for this submission");
    err.statusCode = 404;
    throw err;
  }

  // 2. Upload analysis JSON to Supabase Storage
  const bucketPath = await uploadReportToStorage(submissionId, analysisJson);

  // 3. Insert lead record
  await insertReportAccess(submissionId, email, name, bucketPath);

  // 4. Return the full analysis so frontend renders without a second call
  res.json({ analysis: analysisJson });
});

module.exports = { unlock };
