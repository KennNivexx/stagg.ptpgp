-- Reward & Penggajian module fixes.
-- Apply via: Supabase Dashboard > SQL Editor

-- ── Payroll: payslip generation was completely broken — generatePayslip()
-- already tries to insert `tax`, and the payslip HTML template (src/app/api/
-- payslip/[id]/route.ts) already reads `bonus`, `bpjs_health`,
-- `bpjs_employment`, but none of these columns existed on `payroll` yet.
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS bonus NUMERIC DEFAULT 0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS bpjs_health NUMERIC DEFAULT 0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS bpjs_employment NUMERIC DEFAULT 0;

-- ── incentive_payments: the Insentif and Bonus pages both read/write this
-- same table with no distinguishing column, so entries from one feature
-- leak into the other's list and stats. Add `type` to separate them.
ALTER TABLE incentive_payments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'incentive';
ALTER TABLE incentive_payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill existing rows: anything whose `program` matches one of the Bonus
-- page's fixed types (BonusesClient.tsx BONUS_TYPES) was created from the
-- Bonus page, everything else came from the Insentif page.
UPDATE incentive_payments
SET type = 'bonus'
WHERE program IN ('Kinerja', 'Proyek', 'Tahunan', 'Khusus', 'Lebaran', 'THR');

UPDATE incentive_payments
SET type = 'incentive'
WHERE type IS NULL OR type <> 'bonus';
