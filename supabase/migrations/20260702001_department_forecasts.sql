-- ============================================================
-- Proyeksi Kebutuhan SDM per departemen per kuartal/tahun
-- ============================================================

CREATE TABLE IF NOT EXISTS department_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  year INTEGER NOT NULL,
  q1 INTEGER NOT NULL DEFAULT 0,
  q2 INTEGER NOT NULL DEFAULT 0,
  q3 INTEGER NOT NULL DEFAULT 0,
  q4 INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE department_forecasts ADD CONSTRAINT department_forecasts_dept_year_unique UNIQUE (department, year);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_department_forecasts_year ON department_forecasts(year);
