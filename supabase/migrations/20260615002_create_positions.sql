CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department);
CREATE INDEX IF NOT EXISTS idx_positions_code ON positions(code);

INSERT INTO positions (id, code, name, department)
SELECT DISTINCT ON (position)
  gen_random_uuid()::text,
  position,
  position,
  department
FROM employees
WHERE position IS NOT NULL AND position != ''
  AND status != 'Inactive'
ON CONFLICT (code) DO NOTHING;
