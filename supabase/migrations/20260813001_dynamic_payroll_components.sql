-- Flexible payroll components (per boss's request: "dapat dibuat flexible
-- dengan menambahkan jenis tunjangan dan jenis potongan"). Replaces the fixed
-- transport_allowance/meal_allowance/housing_allowance/position_allowance/
-- kompensasi/potongan_amal_jariyah columns on struktur_gaji with an
-- admin-manageable master list + per-employee component values, so HRD can
-- add new allowance/deduction types from the UI without a code change.
--
-- struktur_gaji keeps basic_salary + ptkp_status (always-present, structural
-- fields); every tunjangan/potongan line item now lives in
-- struktur_gaji_komponen instead.

create table if not exists jenis_komponen_gaji (
  id text primary key,
  nama text not null,
  tipe text not null check (tipe in ('tunjangan', 'potongan')),
  deskripsi text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists struktur_gaji_komponen (
  id text primary key,
  employee_id uuid not null references karyawan(id) on delete cascade,
  komponen_id text not null references jenis_komponen_gaji(id) on delete cascade,
  jumlah numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, komponen_id)
);
create index if not exists idx_sgk_employee on struktur_gaji_komponen(employee_id);

-- Seed the component types that already exist as fixed columns, so nothing
-- is lost when the app switches to reading from struktur_gaji_komponen.
insert into jenis_komponen_gaji (id, nama, tipe, sort_order) values
  ('komp-transport', 'Tunjangan Transport', 'tunjangan', 1),
  ('komp-makan', 'Tunjangan Makan', 'tunjangan', 2),
  ('komp-perumahan', 'Tunjangan Perumahan', 'tunjangan', 3),
  ('komp-jabatan', 'Tunjangan Jabatan', 'tunjangan', 4),
  ('komp-kompensasi', 'Kompensasi', 'tunjangan', 5),
  ('komp-amal-jariyah', 'Potongan Amal Jariyah', 'potongan', 1)
on conflict (id) do nothing;

-- Migrate existing per-employee fixed-column values into the new component
-- table so historical salary data carries over. Zero-amount components are
-- skipped — no point in a row that contributes nothing.
insert into struktur_gaji_komponen (id, employee_id, komponen_id, jumlah, created_at, updated_at)
select 'sgk-' || employee_id || '-transport', employee_id, 'komp-transport', transport_allowance, now(), now()
from struktur_gaji where coalesce(transport_allowance, 0) > 0
on conflict (employee_id, komponen_id) do nothing;

insert into struktur_gaji_komponen (id, employee_id, komponen_id, jumlah, created_at, updated_at)
select 'sgk-' || employee_id || '-makan', employee_id, 'komp-makan', meal_allowance, now(), now()
from struktur_gaji where coalesce(meal_allowance, 0) > 0
on conflict (employee_id, komponen_id) do nothing;

insert into struktur_gaji_komponen (id, employee_id, komponen_id, jumlah, created_at, updated_at)
select 'sgk-' || employee_id || '-perumahan', employee_id, 'komp-perumahan', housing_allowance, now(), now()
from struktur_gaji where coalesce(housing_allowance, 0) > 0
on conflict (employee_id, komponen_id) do nothing;

insert into struktur_gaji_komponen (id, employee_id, komponen_id, jumlah, created_at, updated_at)
select 'sgk-' || employee_id || '-jabatan', employee_id, 'komp-jabatan', position_allowance, now(), now()
from struktur_gaji where coalesce(position_allowance, 0) > 0
on conflict (employee_id, komponen_id) do nothing;

insert into struktur_gaji_komponen (id, employee_id, komponen_id, jumlah, created_at, updated_at)
select 'sgk-' || employee_id || '-kompensasi', employee_id, 'komp-kompensasi', kompensasi, now(), now()
from struktur_gaji where coalesce(kompensasi, 0) > 0
on conflict (employee_id, komponen_id) do nothing;

insert into struktur_gaji_komponen (id, employee_id, komponen_id, jumlah, created_at, updated_at)
select 'sgk-' || employee_id || '-amaljariyah', employee_id, 'komp-amal-jariyah', potongan_amal_jariyah, now(), now()
from struktur_gaji where coalesce(potongan_amal_jariyah, 0) > 0
on conflict (employee_id, komponen_id) do nothing;
