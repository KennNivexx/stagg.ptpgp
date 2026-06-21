-- career_requests: stores internal job applications and career consultation requests
-- from employees to HRD.
-- Apply via: Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS career_requests (
  id             TEXT PRIMARY KEY,
  employee_email TEXT NOT NULL,
  employee_name  TEXT NOT NULL DEFAULT '',
  type           TEXT NOT NULL CHECK (type IN ('application', 'consultation')),
  job_title      TEXT,
  job_department TEXT,
  status         TEXT NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending', 'Reviewed', 'Completed', 'Rejected')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_requests_email    ON career_requests(employee_email);
CREATE INDEX IF NOT EXISTS idx_career_requests_status   ON career_requests(status);
CREATE INDEX IF NOT EXISTS idx_career_requests_type     ON career_requests(type);
