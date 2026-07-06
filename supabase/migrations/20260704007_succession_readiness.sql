-- Succession readiness gets its own table with per-criteria breakdown,
-- instead of being smuggled into kpi_evaluations via period = "Readiness-<year>"
-- (which polluted real KPI data and threw away the 5-criteria breakdown).
-- Apply via: Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS succession_readiness_assessments (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  kepemimpinan INTEGER NOT NULL DEFAULT 0 CHECK (kepemimpinan BETWEEN 0 AND 100),
  keahlian_teknis INTEGER NOT NULL DEFAULT 0 CHECK (keahlian_teknis BETWEEN 0 AND 100),
  pengalaman INTEGER NOT NULL DEFAULT 0 CHECK (pengalaman BETWEEN 0 AND 100),
  kinerja INTEGER NOT NULL DEFAULT 0 CHECK (kinerja BETWEEN 0 AND 100),
  potensi INTEGER NOT NULL DEFAULT 0 CHECK (potensi BETWEEN 0 AND 100),
  total_score INTEGER NOT NULL DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
  assessed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, year)
);

CREATE INDEX IF NOT EXISTS idx_succession_readiness_employee ON succession_readiness_assessments(employee_id);

-- Migrate old readiness rows out of kpi_evaluations: total score only (the
-- 5-criteria breakdown was never stored, so those columns default to 0 for
-- migrated rows — the UI should treat total_score as authoritative and not
-- assume the breakdown is meaningful for pre-migration records).
INSERT INTO succession_readiness_assessments (id, employee_id, year, total_score, assessed_by, created_at, updated_at)
SELECT
  'sra-' || gen_random_uuid()::text,
  employee_id,
  COALESCE(NULLIF(regexp_replace(period, '^Readiness-', ''), '')::int, EXTRACT(YEAR FROM created_at)::int),
  COALESCE(score, 0),
  evaluator_id,
  created_at,
  COALESCE(updated_at, created_at)
FROM kpi_evaluations
WHERE period LIKE 'Readiness-%'
ON CONFLICT (employee_id, year) DO NOTHING;

DELETE FROM kpi_evaluations WHERE period LIKE 'Readiness-%';
