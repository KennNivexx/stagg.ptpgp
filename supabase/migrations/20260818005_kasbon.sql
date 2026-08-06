-- Enterprise payroll upgrade (Phase B) — Loan/Kasbon (employee cash advance)
-- module. Didn't exist anywhere in this codebase before (confirmed: zero
-- grep hits for pinjaman/kasbon/loan across every migration and action
-- file). Header + installment-schedule shape, mirroring the existing
-- approval-chain pattern (penggajian.status / manpower_approval_steps).
--
-- kasbon_cicilan is keyed by (employee_id, target_month, target_year)
-- directly, NOT by a periode_payroll FK — this keeps Kasbon independently
-- usable even before/without the Payroll Period entity (a separate,
-- independent piece of this upgrade), and matches how penggajian itself is
-- already keyed. employee_id is denormalized onto kasbon_cicilan (rather
-- than joining through kasbon_id -> kasbon.employee_id) since payroll
-- generation filters by employee+period on every run, for every employee.
--
-- Remaining balance is intentionally NOT a stored column — see
-- src/app/actions/kasbon.ts, it's derived as
-- jumlah_pengajuan - sum(kasbon_cicilan where status='Terpotong') so there's
-- no drift-prone duplicate value to keep in sync.
-- Apply via: Supabase Dashboard > SQL Editor

create table if not exists kasbon (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references karyawan(id),
  jumlah_pengajuan numeric not null check (jumlah_pengajuan > 0),
  alasan text,
  jumlah_cicilan integer not null check (jumlah_cicilan >= 1),
  cicilan_per_bulan numeric not null,
  status text not null default 'Diajukan' check (status in ('Diajukan', 'Disetujui', 'Ditolak', 'Berjalan', 'Lunas', 'Dibatalkan')),
  approved_by_id text,
  approved_by_name text,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table if not exists kasbon_cicilan (
  id uuid primary key default gen_random_uuid(),
  kasbon_id uuid not null references kasbon(id) on delete cascade,
  employee_id uuid not null references karyawan(id),
  periode_ke integer not null,
  jumlah numeric not null check (jumlah >= 0),
  status text not null default 'Belum Dibayar' check (status in ('Belum Dibayar', 'Terpotong')),
  target_month integer not null check (target_month between 1 and 12),
  target_year integer not null,
  penggajian_id uuid references penggajian(id),
  tanggal_potong timestamptz
);

create index if not exists idx_kasbon_employee_id on kasbon(employee_id);
create index if not exists idx_kasbon_cicilan_kasbon_id on kasbon_cicilan(kasbon_id);
create index if not exists idx_kasbon_cicilan_lookup on kasbon_cicilan(employee_id, target_month, target_year, status);
