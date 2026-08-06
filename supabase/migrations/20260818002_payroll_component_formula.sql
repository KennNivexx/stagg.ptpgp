-- Enterprise payroll upgrade (Phase A) — part 2 of 4.
--
-- jenis_komponen_gaji currently has no way to say "this allowance is exempt
-- from PPh21" or "this is 10% of gaji pokok, not a flat rupiah amount" —
-- every component is a flat manually-typed number that HRD's
-- computeTaxAndBpjs() dumps wholesale into the PPh21 base. That's wrong:
-- BPJS's wage base and PPh21's taxable-income base are legally distinct in
-- Indonesian payroll, so `taxable` gates ONLY the PPh21 side going forward
-- (see admin.ts computeTaxAndBpjs) — BPJS keeps summing every active
-- tunjangan unfiltered, unchanged from today's behavior.
--
-- formula_percent is intentionally scoped to a closed preset
-- ('fixed'/'percent_of_basic') rather than a free-text formula DSL — this is
-- a production payroll system, not a spreadsheet; an arbitrary-expression
-- evaluator is a real code-injection surface this app has no need to open.
-- 'percent_of_gross' is deliberately excluded — gross isn't well-defined
-- until every component is already summed, which would make it circular
-- given the single-pass calculation in computePayrollEntry/generatePayslip.
-- Apply via: Supabase Dashboard > SQL Editor

alter table jenis_komponen_gaji add column if not exists taxable boolean not null default true;
alter table jenis_komponen_gaji add column if not exists formula_type text not null default 'fixed';
alter table jenis_komponen_gaji add column if not exists formula_percent numeric;

DO $$
DECLARE
  con_name text;
BEGIN
  SELECT con.conname INTO con_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'jenis_komponen_gaji'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%formula_type%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE jenis_komponen_gaji DROP CONSTRAINT %I', con_name);
  END IF;

  ALTER TABLE jenis_komponen_gaji ADD CONSTRAINT jenis_komponen_gaji_formula_type_check
    CHECK (formula_type IN ('fixed', 'percent_of_basic'));
END $$;
