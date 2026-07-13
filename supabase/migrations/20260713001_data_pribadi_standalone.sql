-- Standalone personal-data table for the Employee 360° "Personal Information"
-- tab, deliberately NOT foreign-keyed to karyawan or anything else — keyed
-- only by email (plain text lookup), per explicit request that this data
-- live independent of the rest of the schema. Both HRD (Employee 360°) and
-- the employee themselves (self-service /employee/profile) read/write the
-- same rows.
CREATE TABLE IF NOT EXISTS data_pribadi_karyawan (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nik TEXT,
  birth_place TEXT,
  birth_date TEXT,
  religion TEXT,
  blood_type TEXT,
  marital_status TEXT,
  spouse_name TEXT,
  children_count INTEGER,
  ktp_address TEXT,
  last_education TEXT,
  phone TEXT,
  address TEXT,
  emergency_name TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- keluarga_karyawan / pendidikan_karyawan were meant to already exist from
-- 20260712002_employee360.sql (FK'd to karyawan.id), but that migration was
-- never actually applied to this database — CREATE them here too (same
-- shape, IF NOT EXISTS) so this migration doesn't depend on that one having
-- run first, then decouple them the same way as data_pribadi_karyawan above:
-- key by email instead, no FK. The karyawan_id column is kept (nullable)
-- rather than dropped in case a future run of 20260712002 populates it; new
-- code only writes/reads karyawan_email going forward.
CREATE TABLE IF NOT EXISTS keluarga_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID REFERENCES karyawan(id),
  nama TEXT NOT NULL,
  hubungan TEXT NOT NULL,
  tanggal_lahir TEXT,
  pekerjaan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pendidikan_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID REFERENCES karyawan(id),
  jenjang TEXT NOT NULL,
  institusi TEXT NOT NULL,
  jurusan TEXT,
  tahun_lulus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE keluarga_karyawan ADD COLUMN IF NOT EXISTS karyawan_email TEXT;
ALTER TABLE keluarga_karyawan ALTER COLUMN karyawan_id DROP NOT NULL;
ALTER TABLE keluarga_karyawan DROP CONSTRAINT IF EXISTS keluarga_karyawan_karyawan_id_fkey;

ALTER TABLE pendidikan_karyawan ADD COLUMN IF NOT EXISTS karyawan_email TEXT;
ALTER TABLE pendidikan_karyawan ALTER COLUMN karyawan_id DROP NOT NULL;
ALTER TABLE pendidikan_karyawan DROP CONSTRAINT IF EXISTS pendidikan_karyawan_karyawan_id_fkey;

CREATE INDEX IF NOT EXISTS idx_keluarga_karyawan_email ON keluarga_karyawan(karyawan_email);
CREATE INDEX IF NOT EXISTS idx_pendidikan_karyawan_email ON pendidikan_karyawan(karyawan_email);
