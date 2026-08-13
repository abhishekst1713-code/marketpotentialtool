// src/pages/AssessmentAndDashboard.jsx
import { useEffect, useRef, useState } from "react";
import { generateAnalysis } from "../lib/gemini";
import { exportPdf } from "../lib/exportPdf";
import { createRazorpayOrder, fetchSubmission } from "../lib/db";

// ── Load html2canvas from CDN once ─────────────────────────────────
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error("html2canvas failed to load"));
    document.head.appendChild(script);
  });
}

// ── Load Razorpay checkout script from CDN once ─────────────────────
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(window.Razorpay); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Razorpay checkout script failed to load"));
    document.head.appendChild(script);
  });
}

// Maps React onboarding userData → dashboard.html iframe field codes
function buildPrefill(userData) {
  const SECTOR_MAP = {
    "Information Technology / SaaS": "IT",
    "Healthcare & Pharma": "HC",
    "Financial Services / FinTech": "FS",
    "E-Commerce & Retail": "EC",
    "Education & EdTech": "ED",
    "Manufacturing": "MF",
    "Real Estate & PropTech": "RE",
    "Logistics & Supply Chain": "LG",
    "Media & Entertainment": "ME",
    "Agriculture & AgroTech": "AG",
    "Energy & CleanTech": "EN",
  };

  const BIZ_TYPE_MAP = {
    "B2B": "B2B_SME",
    "B2C": "B2C_MASS",
    "B2B2C": "B2B_SME",
    "D2C": "B2C_MASS",
    "Marketplace": "B2B_SME",
    "SaaS / Platform": "B2B_SME",
    "Other": "B2B_SME",
  };
  return {
    organization: userData.organization,
    bizName: userData.productName || userData.organization,
    sectorCode: SECTOR_MAP[userData.sector] || "OT",
    bizTypeCode: BIZ_TYPE_MAP[userData.businessType] || "B2B_SME",
    geoCode: userData.geography || "PI",
    problem: userData.problem,
    stage: userData.stage,
  };
}

const LOADER_STEPS = [
  { n: 1, msg: "Reading your inputs…", pct: 8 },
  { n: 2, msg: "Searching live market data & sector sizing…", pct: 25 },
  { n: 3, msg: "Fetching real-time competitor profiles & funding data…", pct: 48 },
  { n: 4, msg: "Calculating TAM/SAM/SOM, scores & 12-month projections…", pct: 75 },
  { n: 5, msg: "Assembling your market intelligence dashboard…", pct: 95 },
];

// ── onResult(answers, result) is called by App.jsx to save to Supabase
// ── onScreenshot(blob) is called by App.jsx to upload the dashboard image
// ── onPaymentSuccess() is called optimistically when Razorpay handler fires
export default function AssessmentAndDashboard({
  userData,
  submissionId,
  paid,
  onResult,
  onScreenshot,
  onPaymentSuccess,
  onRestart,
}) {
  const iframeRef = useRef(null);
  const prefillSentRef = useRef(false);
  const latestResultRef = useRef(null);
  const latestFdRef = useRef(null);
  const [payLoading, setPayLoading] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);

  function postToIframe(msg) {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }

  async function handleSubmit(fd) {
    latestFdRef.current = fd;

    // Drive loader steps
    for (const s of LOADER_STEPS) {
      postToIframe({ type: "INFOPACE_LOADER_STEP", step: s.n, msg: s.msg, pct: s.pct });
      await new Promise(r => setTimeout(r, s.n === 3 ? 150 : 300));
    }

    try {
      const result = await generateAnalysis(userData, fd.answers || {});
      latestResultRef.current = result;

      // ── Save result to Supabase via App.jsx callback ──────────
      if (onResult) {
        onResult(fd.answers || {}, result);
      }

      // ── Send full analysis to iframe directly with paid status ──
      postToIframe({ type: "INFOPACE_RENDER", fd, analysis: result, paid: paid });

      // ── Mark analysis as ready so the Pay Now button appears ──
      setAnalysisReady(true);

      // ── Capture screenshot after dashboard renders (with delay for animations) ──
      captureAndUpload();

    } catch (err) {
      console.warn("Gemini analysis failed, falling back to offline:", err.message);

      // Pass null analysis — dashboard.html will run offlineAnalysis(fd) itself
      postToIframe({ type: "INFOPACE_LOADER_STEP", step: 5, msg: "Building live analysis…", pct: 95 });

      if (onResult) {
        onResult(fd.answers || {}, {});
      }

      setTimeout(() => {
        postToIframe({ type: "INFOPACE_RENDER", fd, analysis: null, paid: paid });
        setAnalysisReady(true); // also show Pay button for offline analysis
        // Capture screenshot even for offline analysis
        captureAndUpload();
      }, 600);
    }
  }

  // ── Capture the rendered dashboard and save as base64 data URL ──
  async function captureAndUpload() {
    if (!onScreenshot) return;
    try {
      // Wait for Chart.js animations and rendering to finish
      await new Promise(r => setTimeout(r, 3000));

      const html2canvas = await loadHtml2Canvas();
      const iframeDoc = iframeRef.current?.contentDocument
        || iframeRef.current?.contentWindow?.document;
      if (!iframeDoc) {
        console.warn("⚠️ captureAndUpload: cannot access iframe document");
        return;
      }

      // Target the charts view or fall back to the full dashboard
      const target = iframeDoc.getElementById("viewCharts")
        || iframeDoc.getElementById("dashShell")
        || iframeDoc.body;

      const canvas = await html2canvas(target, {
        useCORS: true,
        allowTaint: true,
        scale: 1.5,            // balance quality vs size
        backgroundColor: "#EEF2F7",
        logging: false,
      });

      // Convert canvas to base64 data URL and send to App.jsx
      const dataUrl = canvas.toDataURL("image/png", 0.85);
      if (dataUrl && dataUrl.length > 100) {
        console.log("📸 Dashboard screenshot captured, length:", dataUrl.length, "chars");
        onScreenshot(dataUrl);
        // Screenshot saved → nudge the user toward the full report and send charts capture
        postToIframe({ type: "INFOPACE_SHOW_REPORT_TIP" });
        postToIframe({ type: "INFOPACE_CHARTS_CAPTURE", chartImageSrc: dataUrl });
      } else {
        console.warn("⚠️ Screenshot capture produced empty result");
      }
    } catch (err) {
      console.warn("⚠️ Screenshot capture failed:", err.message);
    }
  }


  // ── Launch Razorpay Checkout Modal ──────────────────────────────
  // AMOUNT: 100 paise = ₹1.00 for test checkout (Razorpay & UPI minimum limit)
  const PAYMENT_AMOUNT_PAISE = 100;

  // Whenever paid status changes, sync it into the iframe
  useEffect(() => {
    postToIframe({ type: "INFOPACE_PAID_STATUS", paid: paid });
  }, [paid]);

  // Restore session from DB on mount/reload if submissionId is present
  useEffect(() => {
    if (!submissionId) return;

    fetchSubmission(submissionId).then((row) => {
      if (row && row.answers && row.result) {
        latestFdRef.current = { answers: row.answers };
        latestResultRef.current = row.result;
        setAnalysisReady(true);

        postToIframe({
          type: "INFOPACE_RENDER",
          fd: { answers: row.answers },
          analysis: row.result,
          paid: paid
        });
      }
    });
  }, [submissionId]);

  async function handleDirectUnlock() {
    if (!submissionId) {
      console.warn("handleDirectUnlock: submissionId not yet available");
      return;
    }
    setPayLoading(true);

    // Future Razorpay Flow
    /*
    const paymentSuccess = await verifyPayment();
    if (!paymentSuccess) {
       return;
    }
    */

    try {
      const resp = await fetch("/api/payments/test-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      if (!resp.ok) {
        throw new Error(`Direct unlock failed: ${resp.statusText}`);
      }

      // Re-fetch submission details to get fresh paid status from Supabase
      const row = await fetchSubmission(submissionId);
      if (row && row.paid) {
        if (onPaymentSuccess) onPaymentSuccess();
        postToIframe({ type: "INFOPACE_PAID_STATUS", paid: true });
        postToIframe({
          type: "INFOPACE_RENDER",
          fd: latestFdRef.current || { answers: row.answers },
          analysis: latestResultRef.current || row.result,
          paid: true
        });

        // Generate the report immediately
        exportPdf({
          userData,
          answers: latestFdRef.current?.answers || row.answers || {},
          result: latestResultRef.current || row.result || {},
          iframeEl: iframeRef.current,
        });
      }
    } catch (err) {
      console.error("Direct unlock failed:", err.message);
    } finally {
      setPayLoading(false);
    }
  }

  async function launchRazorpay() {
    // Payment is temporarily disabled. Keep payment code in place but comment it out.
    // Future Razorpay Flow
    /*
    const paymentSuccess = await verifyPayment();
    if (!paymentSuccess) {
       return;
    }
    */

    /*
    if (!submissionId) {
      console.warn("launchRazorpay: submissionId not yet available");
      return;
    }
    setPayLoading(true);
    try {
      // 1. Load the Razorpay checkout SDK
      const RazorpayConstructor = await loadRazorpayScript();

      // 2. Create an order on the backend
      const { orderId, amount, currency, keyId } = await createRazorpayOrder(
        submissionId,
        PAYMENT_AMOUNT_PAISE
      );

      // 3. Payment Hub base URL — must end with an existing query param
      //    so we can safely append more params with '&'.
      const PAYMENT_HUB_BASE = import.meta.env.VITE_PAYMENT_HUB_URL ||
        "https://payment-t1ag.onrender.com/?app_id=cofit";

      // 4. Open modal — NO callback_url / callback_method.
      //    The handler function runs in *our* window context so
      //    window.top.location.href works across the iframe boundary.
      const rzp = new RazorpayConstructor({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "Market Potential Tool",
        description: "Unlock Report & Downloads (₹1 Test)",
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
          contact: userData?.phoneFull || userData?.phone || "",
        },
        theme: { color: "#6366f1" },

        // ── Client-side success handler ──────────────────────────────
        // Constructs the Payment Hub URL with payment params and redirects
        // the TOP-LEVEL window (bypasses cross-origin iframe restrictions).
        handler: function (response) {
          const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

          // Optimistic local update
          if (onPaymentSuccess) onPaymentSuccess();

          // Build Payment Hub redirect URL
          const redirectUrl =
            `${PAYMENT_HUB_BASE}` +
            `&razorpay_payment_id=${encodeURIComponent(razorpay_payment_id)}` +
            `&razorpay_order_id=${encodeURIComponent(razorpay_order_id)}` +
            `&razorpay_signature=${encodeURIComponent(razorpay_signature)}` +
            `&session=${encodeURIComponent(submissionId)}`;

          // Use window.top so this works even when called from within an iframe context
          window.top.location.href = redirectUrl;
        },

        modal: {
          ondismiss: () => setPayLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      console.error("Razorpay launch failed:", err.message);
      setPayLoading(false);
    }
    */
  }

  useEffect(() => {
    function handleMessage(event) {
      if (!event.data) return;

      if (event.data.type === "INFOPACE_LOADED") {
        if (latestFdRef.current && latestResultRef.current) {
          postToIframe({
            type: "INFOPACE_RENDER",
            fd: latestFdRef.current,
            analysis: latestResultRef.current,
            paid: paid
          });
        } else if (!prefillSentRef.current) {
          prefillSentRef.current = true;
          postToIframe({ type: "INFOPACE_PREFILL", userData: buildPrefill(userData) });
        }
      }

      if (event.data.type === "INFOPACE_SUBMIT") {
        handleSubmit(event.data.fd);
      }

      if (event.data.type === "INFOPACE_EXPORT_PDF") {
        handleExportPdf();
      }

      if (event.data.type === "INFOPACE_RESET") {
        onRestart();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userData, submissionId, paid]);

  function handleExportPdf() {
    if (!paid) {
      handleDirectUnlock();
      return;
    }
    exportPdf({
      userData,
      answers: latestFdRef.current?.answers || {},
      result: latestResultRef.current || {},
      iframeEl: iframeRef.current,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <iframe
        ref={iframeRef}
        src="/dashboard.html?v=1.0.2"
        onLoad={() => {
          if (!prefillSentRef.current) {
            prefillSentRef.current = true;
            postToIframe({ type: "INFOPACE_PREFILL", userData: buildPrefill(userData) });
          }
        }}
        style={{ position: "absolute", inset: 0, border: "none", width: "100%", height: "100%" }}
        title="Infopace Assessment"
        sandbox="allow-scripts allow-same-origin allow-popups allow-downloads"
      />

      {/* ── Pay Now button — shown after analysis loads, hidden once paid ── */}
      {analysisReady && !paid && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
          }}
        >
          <button
            id="btn-pay-now"
            onClick={handleDirectUnlock}
            disabled={payLoading}
            style={{
              padding: "14px 28px",
              borderRadius: "12px",
              background: payLoading
                ? "#a5b4fc"
                : "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "15px",
              border: "none",
              cursor: payLoading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
              transition: "all 0.2s ease",
              letterSpacing: "0.3px",
            }}
          >
            {payLoading ? "Opening report…" : "🔓 Unlock Full Report & Downloads"}
          </button>
        </div>
      )}

      {/* ── Paid badge — shown once payment is verified ── */}
      {paid && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "10px 20px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            boxShadow: "0 4px 16px rgba(16,185,129,0.4)",
          }}
        >
          ✅ Full Report Unlocked
        </div>
      )}
    </div>
  );
}
