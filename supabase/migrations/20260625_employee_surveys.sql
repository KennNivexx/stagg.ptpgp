CREATE TABLE IF NOT EXISTS employee_surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  survey_type TEXT NOT NULL,
  questions TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Aktif',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surveys_type ON employee_surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON employee_surveys(status);
