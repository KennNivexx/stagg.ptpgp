-- Optional manual company code (kode perusahaan) on job descriptions and
-- job specifications, so HRD can tie a document to a precise org-unit/
-- position code for clarity instead of relying on position/department text.
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS kode TEXT DEFAULT '';
ALTER TABLE job_specifications ADD COLUMN IF NOT EXISTS kode TEXT DEFAULT '';
