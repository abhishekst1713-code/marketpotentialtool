-- supabase_report_pdf_migration.sql
-- Run this in the Supabase SQL Editor to add the stored-PDF-report column.
-- Safe to run multiple times (uses IF NOT EXISTS).

-- 1. Add 'report_pdf_url' — public URL of the archived PDF report
--    (uploaded to the "reports" Storage bucket on every unlock)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS report_pdf_url TEXT;

-- 2. Document the new column
COMMENT ON COLUMN submissions.report_pdf_url IS 'Public URL of the exported PDF report, uploaded to the "reports" Storage bucket on unlock';
