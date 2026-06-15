-- Job Descriptions
CREATE TABLE IF NOT EXISTS job_descriptions (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  responsibilities TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Specifications
CREATE TABLE IF NOT EXISTS job_specifications (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  education TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workforce Requests
CREATE TABLE IF NOT EXISTS workforce_requests (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT DEFAULT '',
  urgency TEXT NOT NULL DEFAULT 'Sedang',
  status TEXT NOT NULL DEFAULT 'Pending',
  requested_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jd_position ON job_descriptions(position);
CREATE INDEX IF NOT EXISTS idx_js_position ON job_specifications(position);
CREATE INDEX IF NOT EXISTS idx_wr_status ON workforce_requests(status);
CREATE INDEX IF NOT EXISTS idx_wr_department ON workforce_requests(department);
