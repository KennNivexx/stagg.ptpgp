-- Enterprise payroll upgrade (Phase A) — part 1 of 4.
--
-- riwayat_penggajian: immutable audit trail for payroll row mutations
-- (create/edit/status-change/payment). Nothing in this codebase snapshots
-- before/after values on edit today — updatePayrollAmounts just overwrites
-- the row — so "siapa mengedit apa, nilai sebelum/sesudah" was previously
-- unrecoverable once a Draft payroll was edited more than once.
--
-- Also bundles a UNIQUE constraint on penggajian(employee_id, month, year):
-- generateBatchPayroll/computePayrollEntry only prevented duplicate
-- generation via an app-level check-then-insert (admin.ts), no DB-level
-- guarantee — a real race (two concurrent "Generate Payroll" clicks) could
-- create two rows for the same employee+period. The status CHECK constraint
-- name isn't tracked in this repo's migration history either (table
-- predates it), so it's located dynamically the same way 20260815001 did.
-- Apply via: Supabase Dashboard > SQL Editor

create table if not exists riwayat_penggajian (
  id uuid primary key default gen_random_uuid(),
  penggajian_id uuid not null references penggajian(id) on delete cascade,
  action text not null check (action in ('created', 'edited', 'status_change', 'paid')),
  changed_by_id text,
  changed_by_name text,
  changed_by_role text,
  snapshot_before jsonb,
  snapshot_after jsonb,
  note text,
  changed_at timestamptz not null default now()
);

create index if not exists idx_riwayat_penggajian_penggajian_id on riwayat_penggajian(penggajian_id);

DO $$
DECLARE
  con_name text;
BEGIN
  SELECT con.conname INTO con_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'penggajian'
    AND con.contype = 'u'
    AND pg_get_constraintdef(con.oid) ILIKE '%employee_id%month%year%';

  IF con_name IS NULL THEN
    ALTER TABLE penggajian ADD CONSTRAINT penggajian_employee_month_year_unique
      UNIQUE (employee_id, month, year);
  END IF;
END $$;
