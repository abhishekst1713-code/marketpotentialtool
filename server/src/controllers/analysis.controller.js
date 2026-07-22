// server/src/controllers/analysis.controller.js
// Handles POST /api/analysis — builds prompt server-side, calls Gemini, returns parsed JSON.

const { generateAnalysis } = require("../services/gemini.service");
const { asyncHandler } = require("../utils/asyncHandler");

const analyze = asyncHandler(async (req, res) => {
  const { userData, answers } = req.body;

  const analysis = await generateAnalysis(userData, answers);

  res.json({ analysis });
});

module.exports = { analyze };
