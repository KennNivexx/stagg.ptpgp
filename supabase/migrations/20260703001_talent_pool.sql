-- Add talent pool tracking and interview completion columns to applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS in_talent_pool BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS talent_pool_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS talent_pool_added_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reached_interview BOOLEAN DEFAULT FALSE;

-- Index for talent pool queries
CREATE INDEX IF NOT EXISTS idx_applications_talent_pool ON applications (in_talent_pool) WHERE in_talent_pool = true;
