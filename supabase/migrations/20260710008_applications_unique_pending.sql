-- Prevent race-condition duplicate applications: same email + job while an
-- active (non-rejected) application already exists. Partial unique index so
-- a rejected applicant can re-apply for the same job later.
CREATE UNIQUE INDEX IF NOT EXISTS applications_email_job_active_uidx
  ON applications (email, job_id)
  WHERE status <> 'Ditolak';
