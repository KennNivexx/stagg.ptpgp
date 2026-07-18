-- Fixes a real production bug, not just dummy-data seeding: the payroll
-- module was renamed from `payroll`/`incentive_payments` to `penggajian`/
-- `insentif` (Indonesian rename pass) at some point AFTER
-- 20260704006_rewards_payroll_bonus_schema.sql was written. That migration
-- still targets the old English table name `payroll`, which no longer
-- exists — so `ALTER TABLE payroll ADD COLUMN ...` has never been able to
-- run, and `penggajian` is missing `tax`, `bonus`, `bpjs_health`,
-- `bpjs_employment` to this day. Every call to generatePayslip() /
-- computePayrollEntry() in src/app/actions/admin.ts inserts those columns,
-- so "Generate Payslip" has been broken in production the whole time —
-- confirmed live: penggajian currently lacks all 4 columns.
--
-- Re-targets the same fix at the current table name. Safe to re-run
-- (IF NOT EXISTS everywhere).

ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS bonus NUMERIC DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS bpjs_health NUMERIC DEFAULT 0;
ALTER TABLE penggajian ADD COLUMN IF NOT EXISTS bpjs_employment NUMERIC DEFAULT 0;

-- `insentif` (renamed from incentive_payments) already has `type`/`notes` in
-- production, but adding these defensively costs nothing if it doesn't.
ALTER TABLE insentif ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'incentive';
ALTER TABLE insentif ADD COLUMN IF NOT EXISTS notes TEXT;
