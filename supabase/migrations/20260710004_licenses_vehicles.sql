-- Modul khusus forwarding tahap 1 (fokus memudahkan HRD): SIM & Sertifikasi
-- karyawan (dengan expiry tracking) + Manajemen Armada Kendaraan.

-- SIM (SIM A/B1/B2/B3/C) dan sertifikasi (K3, Defensive Driving, dll) —
-- satu tabel karena keduanya sama-sama "dokumen berlaku dengan expiry" yang
-- perlu dipantau HRD, cukup dibedakan lewat kolom category.
CREATE TABLE IF NOT EXISTS employee_licenses (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'SIM', -- 'SIM' atau 'Sertifikasi'
  license_type TEXT NOT NULL,           -- cth. 'SIM B2', 'Sertifikat K3', 'Defensive Driving'
  license_number TEXT DEFAULT '',
  issued_date DATE,
  expiry_date DATE NOT NULL,
  document_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_licenses_employee ON employee_licenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_licenses_expiry ON employee_licenses(expiry_date);

-- Armada kendaraan
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  plate_number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Truk',   -- Truk, Tronton, Box, Pickup, Trailer, dll
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  year INTEGER,
  status TEXT NOT NULL DEFAULT 'Aktif', -- Aktif, Servis, Nonaktif
  stnk_expiry DATE,
  kir_expiry DATE,
  insurance_expiry DATE,
  assigned_driver_id TEXT,             -- employees.id, nullable
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON vehicles(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);

insert into storage.buckets (id, name, public)
values ('vehicle-license-docs', 'vehicle-license-docs', true)
on conflict (id) do nothing;

drop policy if exists "vehicle-license-docs public read" on storage.objects;
create policy "vehicle-license-docs public read"
on storage.objects for select
using (bucket_id = 'vehicle-license-docs');

drop policy if exists "vehicle-license-docs public insert" on storage.objects;
create policy "vehicle-license-docs public insert"
on storage.objects for insert
with check (bucket_id = 'vehicle-license-docs');

drop policy if exists "vehicle-license-docs public update" on storage.objects;
create policy "vehicle-license-docs public update"
on storage.objects for update
using (bucket_id = 'vehicle-license-docs');
