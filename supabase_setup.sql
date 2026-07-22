-- ================================================================
--  Infopace — Supabase Database Setup
--  Run this entire file in: Supabase → SQL Editor → Run
--
--  MIGRATION NOTE (post-backend-refactor):
--  All direct client access to the submissions table has been removed.
--  The Express backend uses the Supabase SERVICE_ROLE_KEY, which bypasses
--  RLS entirely. No public policies are needed or desired.
--
--  The old USING(true) policies (insert/select/update) were a security bug:
--  they allowed any anonymous client to read or overwrite any user's data
--  (name, email, phone, answers, analysis). Those policies are dropped below.
-- ================================================================

-- 1. Drop old table if re-running (comment out if you want to keep data)
-- drop table if exists public.submissions;

-- 2. Create submissions table
--    Stores BOTH the onboarding form data AND the final assessment result
create table if not exists public.submissions (
  id              uuid        default gen_random_uuid() primary key,

  -- ── Onboarding: Step 1 (Personal Info) ──────────────────────
  name            text        not null,
  email           text        not null,
  phone           text,
  phone_full      text,           -- e.g. +919876543210
  country_code    text,           -- e.g. +91
  organization    text,
  role            text,
  website         text,
  linkedin        text,
  team_size       text,

  -- ── Onboarding: Step 2 (Venture Context) ────────────────────
  product_name    text,
  business_type   text,
  sector          text,
  geography       text,
  problem         text,
  stage           text,

  -- ── Assessment answers (JSON from dashboard) ────────────────
  answers         jsonb,

  -- ── Final result from AI analysis ───────────────────────────
  overall_score   integer,
  grade           text,
  verdict         text,
  tam_crore       numeric,
  sam_crore       numeric,
  som_crore       numeric,
  growth_rate     numeric,
  dimensions      jsonb,      -- {d1,d2,d3,d4,d5,d6} scores
  key_insights    jsonb,      -- array of insight strings
  top_risks       jsonb,      -- array of risk strings
  quick_wins      jsonb,      -- array of quick win strings
  analysis_json   jsonb,      -- full raw analysis object

  -- ── Screenshot URL (stored in Supabase Storage) ─────────────
  screenshot_url  text,       -- public URL of captured dashboard image

  -- ── Status tracking ─────────────────────────────────────────
  status          text        default 'onboarding_complete',
  -- 'onboarding_complete' = form filled, assessment not yet done
  -- 'assessment_complete' = dashboard generated with result

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 3. Enable Row Level Security
alter table public.submissions enable row level security;

-- 4. DROP the old insecure public policies
--    These allowed any anonymous client to read/write/update any row.
drop policy if exists "Allow public inserts" on public.submissions;
drop policy if exists "Allow public reads" on public.submissions;
drop policy if exists "Allow public updates" on public.submissions;

-- 5. No public policies — service role bypasses RLS by design.
--    If you later want authenticated users to read their own row, add:
--    create policy "Users can read own submissions" on public.submissions
--      for select using (auth.uid()::text = user_id);
--    (requires adding a user_id column tied to Supabase Auth)

-- 6. Useful indexes
create index if not exists submissions_email_idx
  on public.submissions (email);

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);

create index if not exists submissions_status_idx
  on public.submissions (status);

-- 7. Auto-update updated_at on row change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.submissions;
create trigger set_updated_at
  before update on public.submissions
  for each row execute function public.handle_updated_at();

-- ================================================================
--  REPORT ACCESS — Lead capture when users unlock full reports
-- ================================================================

create table if not exists public.report_access (
  id                 uuid        default gen_random_uuid() primary key,
  submission_id      uuid        references public.submissions(id) on delete cascade,
  email              text        not null,
  name               text,
  report_bucket_path text,       -- e.g. "reports/{submissionId}.json"
  unlocked_at        timestamptz default now(),
  created_at         timestamptz default now()
);

alter table public.report_access enable row level security;
-- No public policies — service role only (same pattern as submissions)

create index if not exists report_access_submission_idx
  on public.report_access (submission_id);

create index if not exists report_access_email_idx
  on public.report_access (email);

-- ================================================================
--  DONE. You should see both `submissions` and `report_access`
--  tables in Table Editor. All data access goes through the
--  Express backend using the service role key.
-- ================================================================