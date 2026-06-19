-- Add missing title and description columns to job_postings
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Backfill: copy position to title where title is empty
UPDATE job_postings SET title = position WHERE title = '' OR title IS NULL;
