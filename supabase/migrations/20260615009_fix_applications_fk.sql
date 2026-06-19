-- Fix applications FK and column types
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_job_id_fkey;
ALTER TABLE applications ALTER COLUMN id TYPE TEXT;
ALTER TABLE job_postings ALTER COLUMN id TYPE TEXT;
