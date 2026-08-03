-- supabase_payment_migration.sql
-- Run this in the Supabase SQL Editor to add payment tracking columns.
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks).

-- 1. Add 'paid' boolean flag (default false)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add Razorpay order ID (created before checkout opens)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- 3. Add Razorpay payment ID (captured after successful payment)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- 4. Create an index for fast lookup by order ID (used in /payment-status handler)
CREATE INDEX IF NOT EXISTS idx_submissions_razorpay_order_id
  ON submissions (razorpay_order_id);

-- 5. (Optional) Add a comment documenting the new columns
COMMENT ON COLUMN submissions.paid IS 'True once Razorpay signature has been server-verified';
COMMENT ON COLUMN submissions.razorpay_order_id IS 'Razorpay order ID created before checkout opens';
COMMENT ON COLUMN submissions.razorpay_payment_id IS 'Razorpay payment ID captured after payment success';
