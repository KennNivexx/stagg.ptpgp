-- Enterprise payroll upgrade (Phase C) — Payroll Period entity.
--
-- penggajian rows have always been flat per-employee-per-month with no
-- period-level grouping/locking object — "Generate Payroll" for a month
-- just bulk-inserts rows filtered by month/year, with no single row anyone
-- can point to and say "this is August 2026's payroll run" or lock closed.
--
-- This is a LOCKING/GROUPING layer ABOVE the existing per-employee approval
-- chain (Draft->Verified_SDM->Verified_Keuangan->Approved->Paiad on
-- penggajian.status itself) — NOT a replacement. periode_payroll.status is
-- a coarser, HRD/superadmin-controlled summary; Closed hard-blocks further
-- edits on every row in that period regardless of the row's own status.
--
-- penggajian.id was confirmed uuid via a live query against this exact DB
-- (sample id: c7ae8cdf-0c8c-4048-8691-99af4e5840e0) before writing this FK,
-- not assumed.
-- Apply via: Supabase Dashboard > SQL Editor

create table if not exists periode_payroll (
  id uuid primary key default gen_random_uuid(),
  nama_periode text not null,
  bulan integer not null check (bulan between 1 and 12),
  tahun integer not null,
  tanggal_awal date not null,
  tanggal_akhir date not null,
  status text not null default 'Draft' check (status in ('Draft', 'Processing', 'Waiting Approval', 'Approved', 'Paid', 'Closed', 'Cancelled')),
  created_by_id text,
  created_by_name text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index if not exists idx_periode_payroll_bulan_tahun on periode_payroll(bulan, tahun);

alter table penggajian add column if not exists period_id uuid references periode_payroll(id);
