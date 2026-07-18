-- Recruitment Management, Round 2 — the pieces deliberately deferred last
-- round because they needed workflow decisions, not just backend math:
-- multi-panel interview scoring, a real multi-stage Hiring Approval chain,
-- Background Check / Medical Check Up, and a formalized Offer Letter record.
--
-- Roles used below (HR, Department Head, Finance, Director) map 1:1 onto
-- roles that actually exist in this app's auth system (hrd/superadmin,
-- department_manager, the existing Finance-approval-flag pattern already
-- used by Manpower Requests, director) — no invented organizational roles.

-- ── Multi-panel interview scoring ────────────────────────────────────────
-- Replaces the single `interviewer` text field's implicit "one interview,
-- one opinion" with real per-panelist scoring — each interviewer (HR, User/
-- Dept Manager, Director) submits their own score+notes independently.
CREATE TABLE IF NOT EXISTS interview_scores (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES pelamar(id) ON DELETE CASCADE,
  panel_role TEXT NOT NULL CHECK (panel_role IN ('HR', 'User/Dept Manager', 'Director')),
  panelist_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, panel_role)
);

-- ── Hiring Approval chain ─────────────────────────────────────────────────
-- HR -> Department Head -> Finance -> Director, mirroring the pattern
-- already shipped for Manpower Request approvals (career_approvals /
-- er_approvals) instead of inventing a new shape.
CREATE TABLE IF NOT EXISTS hiring_approval_steps (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES pelamar(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_role TEXT NOT NULL CHECK (approver_role IN ('HR', 'Department Head', 'Finance', 'Director')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Skipped')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, step_number)
);

-- ── Background Check / Medical Check Up ──────────────────────────────────
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS background_check_status TEXT DEFAULT 'Belum Dilakukan' CHECK (background_check_status IN ('Belum Dilakukan', 'Proses', 'Bersih', 'Ditandai'));
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS background_check_notes TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS background_check_at TIMESTAMPTZ;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS medical_checkup_status TEXT DEFAULT 'Belum Dilakukan' CHECK (medical_checkup_status IN ('Belum Dilakukan', 'Fit', 'Fit With Note', 'Unfit'));
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS medical_checkup_notes TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS medical_checkup_at TIMESTAMPTZ;

-- ── Offer Letter (formalized — no cryptographic e-signature infra exists
-- in this app, so this is a real generated-document + accept/decline flow,
-- not a fabricated "digital signature"). respondToOffer() in recruitment.ts
-- already lets an applicant accept/counter a salary — this adds the actual
-- letter document lifecycle around that same decision.
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS offer_letter_content TEXT;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS offer_letter_status TEXT DEFAULT 'Belum Dibuat' CHECK (offer_letter_status IN ('Belum Dibuat', 'Draft', 'Terkirim', 'Diterima', 'Ditolak'));
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS offer_letter_sent_at TIMESTAMPTZ;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS offer_letter_responded_at TIMESTAMPTZ;
