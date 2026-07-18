-- Fixes a real production bug: the "Save KPI Evaluation" feature
-- (saveKpiEvaluation in src/app/actions/performance-hrd.ts) has never been
-- able to insert a new evaluation, because evaluasi_kpi.period_start and
-- .period_end are NOT NULL with no default, but the app never sets them —
-- the KPI form (src/app/hrd/performance/kpi/KpiForm.tsx) only ever collects
-- a freeform `period` text field (placeholder "Q1 2026 / Jan 2026"), not
-- exact start/end dates. Grepping the whole app confirms period_start/
-- period_end on evaluasi_kpi are never read anywhere either — they're
-- vestigial columns from an earlier design that the current freeform-period
-- UI was never built around. Making them nullable matches the app's actual
-- data model instead of forcing a UI redesign to populate dates nobody reads.

ALTER TABLE evaluasi_kpi ALTER COLUMN period_start DROP NOT NULL;
ALTER TABLE evaluasi_kpi ALTER COLUMN period_end DROP NOT NULL;
