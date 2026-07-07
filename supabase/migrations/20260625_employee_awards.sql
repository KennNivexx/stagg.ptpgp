CREATE TABLE IF NOT EXISTS employee_awards (
  id TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  employee_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  award_date TEXT NOT NULL,
  given_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_awards_employee ON employee_awards(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_awards_category ON employee_awards(category);
