-- Allow multiple job-description / job-specification entries per position/department,
-- each distinguished by a short title. responsibilities/requirements/skills/certifications
-- were already TEXT[] (dynamic list), so no change needed there — this migration only
-- adds a "title" label per entry and relaxes job_specifications.position to be optional
-- since job specs are scoped per-department rather than per-position.

ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE job_specifications ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';

-- job_specifications is now scoped by department; position becomes optional context.
ALTER TABLE job_specifications ALTER COLUMN position DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jd_department ON job_descriptions(department);
CREATE INDEX IF NOT EXISTS idx_js_department ON job_specifications(department);
