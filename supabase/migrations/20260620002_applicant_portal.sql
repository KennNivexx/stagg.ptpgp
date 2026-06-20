-- Support applicant role in users table (role column is TEXT, no enum change needed)
-- Add application_id reference to users for quick lookup
ALTER TABLE users ADD COLUMN IF NOT EXISTS application_id TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_users_application_id ON users(application_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Track when applicant accounts were created and if they are temporary
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Index on applications email for fast lookup
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
