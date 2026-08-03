// server/src/services/supabase.service.js
// Server-side Supabase client using the SERVICE_ROLE_KEY.
// This key bypasses RLS — all access control is handled by the backend logic.

const { createClient } = require("@supabase/supabase-js");
const { env } = require("../config/env");

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Insert a new submission row (onboarding data).
 * @returns {{ id: string }} The UUID of the inserted row.
 */
async function insertSubmission(userData) {
  const { data, error } = await supabase
    .from("submissions")
    .insert([
      {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        phone_full: userData.phoneFull || null,
        country_code: userData.countryCode || null,
        organization: userData.organization || null,
        role: userData.role || null,
        website: userData.website || null,
        linkedin: userData.linkedin || null,
        team_size: userData.teamSize || null,
        product_name: userData.productName || null,
        business_type: userData.businessType || null,
        sector: userData.sector || null,
        geography: userData.geography || null,
        problem: userData.problem || null,
        stage: userData.stage || null,
        status: "onboarding_complete",
      },
    ])
    .select("id")
    .single();

  if (error) {
    const err = new Error(`Supabase insert failed: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return { id: data.id };
}

/**
 * Update a submission with assessment answers and AI analysis result.
 * @returns {{ id: string }}
 */
async function updateSubmissionResult(id, answers, result) {
  // First check if the row exists
  const { data: existing, error: fetchError } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    const err = new Error("Submission not found");
    err.statusCode = 404;
    throw err;
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      answers,
      overall_score: result?.overallScore ?? null,
      grade: result?.grade ?? null,
      verdict: result?.verdict ?? null,
      tam_crore: result?.tamCrore ?? null,
      sam_crore: result?.samCrore ?? null,
      som_crore: result?.somCrore ?? null,
      growth_rate: result?.growthRate ?? null,
      dimensions: result?.dimensions ?? null,
      key_insights: result?.keyInsights ?? null,
      top_risks: result?.topRisks ?? null,
      quick_wins: result?.quickWins ?? null,
      analysis_json: result ?? null,
      status: "assessment_complete",
    })
    .eq("id", id);

  if (error) {
    const err = new Error(`Supabase update failed: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return { id };
}

/**
 * Upload screenshot as a real PNG to Supabase Storage and save the public URL.
 * Bucket: "screenshots" (auto-created if missing).
 * File path: <submissionId>.png
 * @returns {{ id: string, screenshotUrl: string }}
 */
async function updateSubmissionScreenshot(id, dataUrl) {
  // Check existence
  const { data: existing, error: fetchError } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    const err = new Error("Submission not found");
    err.statusCode = 404;
    throw err;
  }

  // ── Decode base64 data URL → Buffer ──────────────────────────────
  // Format: data:image/png;base64,iVBOR...
  const match = dataUrl.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
  if (!match) {
    const err = new Error("Invalid image data URL format");
    err.statusCode = 400;
    throw err;
  }

  const imageFormat = match[1].toLowerCase().replace("jpeg", "jpg");
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  const contentType = `image/${imageFormat === "jpg" ? "jpeg" : imageFormat}`;
  const filePath = `${id}.${imageFormat === "jpg" ? "jpg" : "png"}`;

  // ── Ensure the "screenshots" bucket exists ───────────────────────
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === "screenshots");
  if (!bucketExists) {
    const { error: createErr } = await supabase.storage.createBucket("screenshots", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
    });
    if (createErr && !createErr.message.includes("already exists")) {
      console.error("Failed to create screenshots bucket:", createErr.message);
    }
  }

  // ── Upload to Supabase Storage ───────────────────────────────────
  const { error: uploadError } = await supabase.storage
    .from("screenshots")
    .upload(filePath, buffer, {
      contentType,
      upsert: true, // overwrite if re-uploading
    });

  if (uploadError) {
    const err = new Error(`Screenshot upload failed: ${uploadError.message}`);
    err.statusCode = 500;
    throw err;
  }

  // ── Get the public URL ───────────────────────────────────────────
  const { data: urlData } = supabase.storage
    .from("screenshots")
    .getPublicUrl(filePath);

  const publicUrl = urlData?.publicUrl || null;

  // ── Save the public URL to the database ──────────────────────────
  const { error: updateError } = await supabase
    .from("submissions")
    .update({ screenshot_url: publicUrl })
    .eq("id", id);

  if (updateError) {
    const err = new Error(`Supabase screenshot URL update failed: ${updateError.message}`);
    err.statusCode = 500;
    throw err;
  }

  console.log(`  📸 Screenshot uploaded: ${filePath} → ${publicUrl}`);
  return { id, screenshotUrl: publicUrl };
}

/**
 * Fetch a single submission by UUID.
 * @returns {object} The full submission row.
 */
async function getSubmissionById(id) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    const err = new Error("Submission not found");
    err.statusCode = 404;
    throw err;
  }

  return data;
}

/**
 * Upload the analysis JSON to Supabase Storage for archival.
 * Bucket: "report-access" (auto-created if missing).
 * Path: reports/{submissionId}.json
 * @returns {string} The bucket path.
 */
async function uploadReportToStorage(submissionId, analysisJson) {
  const bucketName = "report-access";
  const filePath = `reports/${submissionId}.json`;

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucketName);
  if (!bucketExists) {
    const { error: createErr } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
    });
    if (createErr && !createErr.message.includes("already exists")) {
      console.error("Failed to create report-access bucket:", createErr.message);
    }
  }

  // Upload JSON file
  const buffer = Buffer.from(JSON.stringify(analysisJson, null, 2), "utf-8");
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadError) {
    const err = new Error(`Report upload failed: ${uploadError.message}`);
    err.statusCode = 500;
    throw err;
  }

  console.log(`  📄 Report uploaded: ${filePath}`);
  return filePath;
}

/**
 * Insert a lead record into report_access table.
 * @returns {{ id: string }}
 */
async function insertReportAccess(submissionId, email, name, bucketPath) {
  const { data, error } = await supabase
    .from("report_access")
    .insert([
      {
        submission_id: submissionId,
        email,
        name: name || null,
        report_bucket_path: bucketPath,
      },
    ])
    .select("id")
    .single();

  if (error) {
    const err = new Error(`Report access insert failed: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  console.log(`  🔓 Report access recorded: ${data.id} for ${email}`);
  return { id: data.id };
}

/**
 * Persist the Razorpay order ID on a submission row immediately after order creation.
 * Called before the checkout modal is opened so the order ID is never lost.
 * @param {string} id - Submission UUID
 * @param {string} orderId - Razorpay order ID (e.g. "order_...")
 */
async function saveRazorpayOrderId(id, orderId) {
  const { error } = await supabase
    .from("submissions")
    .update({ razorpay_order_id: orderId })
    .eq("id", id);

  if (error) {
    // Non-fatal — log and continue; payment can still proceed
    console.error(`[payment] Failed to save razorpay_order_id for ${id}:`, error.message);
  }
}

/**
 * Mark a submission as paid after successful server-side signature verification.
 * @param {string} id - Submission UUID
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 */
async function markSubmissionPaid(id, orderId, paymentId) {
  const { error } = await supabase
    .from("submissions")
    .update({
      paid: true,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      status: "paid",
    })
    .eq("id", id);

  if (error) {
    const err = new Error(`Failed to mark submission as paid: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  console.log(`  💰 Submission ${id} marked as PAID (payment: ${paymentId})`);
}

module.exports = {
  insertSubmission,
  updateSubmissionResult,
  updateSubmissionScreenshot,
  getSubmissionById,
  uploadReportToStorage,
  insertReportAccess,
  saveRazorpayOrderId,
  markSubmissionPaid,
};
