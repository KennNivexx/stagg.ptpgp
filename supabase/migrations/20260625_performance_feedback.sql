-- Performance 360° Feedback
CREATE TABLE IF NOT EXISTS performance_feedback (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  reviewer_id TEXT,
  reviewer_name TEXT,
  category TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_feedback_employee ON performance_feedback(employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_feedback_created ON performance_feedback(created_at DESC);
