-- Tambah kolom grade_code dan job_desc ke workforce_requests
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS grade_code TEXT;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS job_desc TEXT;
