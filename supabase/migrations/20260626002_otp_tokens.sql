-- ============================================================
-- One-time login tokens for passwordless onboarding
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS one_time_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS one_time_token_expires TIMESTAMPTZ;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_users_one_time_token ON users(one_time_token) WHERE one_time_token IS NOT NULL;
