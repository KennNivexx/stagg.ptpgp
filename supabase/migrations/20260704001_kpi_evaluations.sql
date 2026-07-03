-- The live `kpi_evaluations` table was created with a schema
-- (period_start/period_end/target_score/actual_score/feedback, uuid id,
-- evaluator_id FK'd to employees) that no application code actually uses.
-- All KPI-related pages/actions (src/app/actions/performance-hrd.ts,
-- src/app/hrd/dashboard-kpi, src/app/hrd/performance/kpi,
-- src/app/hrd/performance/reviews, src/app/hrd/succession/*) read/write
-- id (TEXT "kpi-<uuid>"), employee_id, period, score, comments, status,
-- evaluator_id (HRD user email), created_at, updated_at instead — none of
-- which line up, so every insert/select against this table has been failing
-- silently (dashboard always shows 0) or erroring outright (save evaluation
-- fails because evaluator_id/id types reject the values the app sends).
--
-- Nothing references period_start/period_end/target_score/actual_score/feedback
-- anywhere in the codebase, so they're left in place (harmless, unused) rather
-- than dropped. This migration only fixes the columns the app actually needs.

-- id must accept the app's "kpi-<uuid>" string format, not native uuid.
ALTER TABLE kpi_evaluations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE kpi_evaluations ALTER COLUMN id TYPE TEXT USING id::text;

-- evaluator_id stores the HRD user's email (from the `users` table, which
-- has no row in `employees`), not an employees.id FK — drop the FK and
-- widen the column to text.
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'kpi_evaluations'::regclass
    AND contype = 'f'
    AND conkey = (
      SELECT array_agg(attnum) FROM pg_attribute
      WHERE attrelid = 'kpi_evaluations'::regclass AND attname = 'evaluator_id'
    );
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE kpi_evaluations DROP CONSTRAINT %I', con_name);
  END IF;
END $$;
ALTER TABLE kpi_evaluations ALTER COLUMN evaluator_id TYPE TEXT USING evaluator_id::text;

-- Columns the app actually reads/writes that don't exist yet.
ALTER TABLE kpi_evaluations
  ADD COLUMN IF NOT EXISTS period TEXT,
  ADD COLUMN IF NOT EXISTS score INTEGER CHECK (score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS comments TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_evaluations_employee_period ON kpi_evaluations(employee_id, period);
CREATE INDEX IF NOT EXISTS idx_kpi_evaluations_created_at ON kpi_evaluations(created_at DESC);
