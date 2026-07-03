-- Shift Kerja (jadwal shift berbasis tanggal + bonus), Lokasi Kerja (tabel nyata
-- + penempatan karyawan), dan Dokumen Perusahaan (dengan kontrol visibilitas per
-- portal). Dipakai oleh:
--   src/app/hrd/infrastructure/shifts/page.tsx
--   src/app/hrd/infrastructure/locations/page.tsx
--   src/app/hrd/infrastructure/documents/page.tsx
--   src/app/employee/documents/page.tsx
--   src/app/department/documents/page.tsx (baru)
-- Apply via: Supabase Dashboard > SQL Editor

-- ── Shift Kerja ─────────────────────────────────────────────────────────────
-- Definisi jenis shift (Pagi/Siang/Malam/custom) dengan jam kerja & info bonus.
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL DEFAULT '08:00',
  end_time TEXT NOT NULL DEFAULT '16:00',
  has_bonus BOOLEAN NOT NULL DEFAULT FALSE,
  bonus_amount NUMERIC DEFAULT 0,
  color TEXT DEFAULT 'amber',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penugasan shift per karyawan per tanggal — memungkinkan tampilan kalender dan
-- shift yang berbeda-beda tiap hari (perusahaan logistik/forwarding: shift malam
-- di hari tertentu, shift siang di hari lain).
CREATE TABLE IF NOT EXISTS shift_schedules (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  shift_id TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  has_bonus BOOLEAN NOT NULL DEFAULT FALSE,
  bonus_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, shift_date)
);

CREATE INDEX IF NOT EXISTS idx_shift_schedules_employee_id ON shift_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_shift_date ON shift_schedules(shift_date);

-- Seed 3 shift standar jika tabel baru dibuat kosong.
INSERT INTO shifts (id, name, start_time, end_time, has_bonus, bonus_amount, color)
SELECT * FROM (VALUES
  ('shift-pagi',  'Pagi',  '06:00', '14:00', FALSE, 0, 'amber'),
  ('shift-siang', 'Siang', '14:00', '22:00', FALSE, 0, 'orange'),
  ('shift-malam', 'Malam', '22:00', '06:00', TRUE,  50000, 'indigo')
) AS seed(id, name, start_time, end_time, has_bonus, bonus_amount, color)
WHERE NOT EXISTS (SELECT 1 FROM shifts);

-- ── Lokasi Kerja ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Kantor',
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penempatan karyawan ke lokasi kerja (kolom sederhana di employees, cukup
-- untuk kebutuhan "karyawan mana di lokasi mana").
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location_id TEXT;
CREATE INDEX IF NOT EXISTS idx_employees_location_id ON employees(location_id);

-- Seed lokasi awal (memindahkan data mock yang sebelumnya hidup di client-side
-- LokasiKerja component) jika tabel baru dibuat kosong.
INSERT INTO work_locations (id, name, address, type, status)
SELECT * FROM (VALUES
  ('loc-pusat',    'Kantor Pusat',            'Jl. Sudirman No. 123, Jakarta Pusat', 'Kantor', 'Aktif'),
  ('loc-gudang',   'Gudang Utama',            'Jl. Industri Raya No. 45, Bekasi',    'Gudang', 'Aktif'),
  ('loc-bandung',  'Kantor Cabang Bandung',   'Jl. Asia Afrika No. 78, Bandung',     'Cabang', 'Aktif'),
  ('loc-surabaya', 'Kantor Cabang Surabaya',  'Jl. Tunjungan No. 56, Surabaya',      'Cabang', 'Aktif'),
  ('loc-semarang', 'Gudang Regional',         'Jl. Raya Semarang No. 90, Semarang',  'Gudang', 'Aktif')
) AS seed(id, name, address, type, status)
WHERE NOT EXISTS (SELECT 1 FROM work_locations);

-- ── Dokumen Perusahaan ──────────────────────────────────────────────────────
-- Sebelumnya hanya mock data di client. Tabel nyata + kontrol visibilitas per
-- portal (karyawan / kepala departemen). HRD selalu bisa melihat semuanya.
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Lainnya',
  status TEXT NOT NULL DEFAULT 'Aktif',
  url TEXT,
  size TEXT,
  type TEXT DEFAULT 'PDF',
  visible_to_employee BOOLEAN NOT NULL DEFAULT FALSE,
  visible_to_department_head BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
