-- HRIS Enterprise redesign of "Desain Organisasi": SK-versioned org structure,
-- a real Master Jabatan table, Position Number/Formasi, Grade & Level, Career
-- Path master edges, and per-employee position assignment history. Organization
-- design (unit_organisasi/jabatan) is decoupled from personnel: unit_organisasi
-- keeps its old leader_name/leader_email columns for backward read compat but
-- they are no longer written by the app — "who leads a unit" is now derived
-- from formasi_jabatan (whoever holds a Position Number flagged is_kepala_unit).

CREATE TABLE IF NOT EXISTS struktur_organisasi_versi (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  nomor_sk TEXT NOT NULL,
  tanggal_sk DATE NOT NULL,
  tanggal_berlaku DATE NOT NULL,
  versi TEXT NOT NULL DEFAULT 'V1.0',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Review','Approved','Archived')),
  keterangan TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS versi_id TEXT REFERENCES struktur_organisasi_versi(id);
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS jenis_unit TEXT DEFAULT 'Departemen';
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS singkatan TEXT;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS jumlah_formasi INTEGER DEFAULT 0;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS budget_cost_center NUMERIC;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS kode_cost_center TEXT;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS business_unit TEXT;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS lokasi_kerja TEXT;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS tanggal_berlaku DATE;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS tanggal_berakhir DATE;
ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Nonaktif'));

ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS grade_id TEXT;
ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS is_kepala_unit BOOLEAN DEFAULT FALSE;
ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Nonaktif'));
-- true = created manually via the new Master Jabatan CRUD; false = legacy
-- rows auto-upserted by getPositionsMonitor() from live employee data.
ALTER TABLE jabatan ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS grade_jabatan (
  id TEXT PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  salary_min NUMERIC,
  salary_max NUMERIC,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formasi_jabatan (
  id TEXT PRIMARY KEY,
  position_number TEXT UNIQUE NOT NULL,
  unit_organisasi_id TEXT NOT NULL REFERENCES unit_organisasi(id),
  jabatan_id TEXT NOT NULL REFERENCES jabatan(id),
  status TEXT NOT NULL DEFAULT 'Vacant' CHECK (status IN ('Vacant','Filled')),
  karyawan_id UUID REFERENCES karyawan(id),
  tanggal_mulai DATE,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_formasi_unit ON formasi_jabatan(unit_organisasi_id);
CREATE INDEX IF NOT EXISTS idx_formasi_karyawan ON formasi_jabatan(karyawan_id);

CREATE TABLE IF NOT EXISTS riwayat_posisi_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  formasi_id TEXT REFERENCES formasi_jabatan(id),
  jabatan_id TEXT REFERENCES jabatan(id),
  unit_organisasi_id TEXT REFERENCES unit_organisasi(id),
  jenis_perubahan TEXT NOT NULL DEFAULT 'Penempatan' CHECK (jenis_perubahan IN ('Hire','Penempatan','Promosi','Mutasi','Demosi','Nonaktif')),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  keterangan TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_riwayat_posisi_karyawan ON riwayat_posisi_karyawan(karyawan_id);

-- Additive only — karyawan.position/department text columns are untouched so
-- every other module (payroll, KPI, competency, reports, ...) keeps working
-- unmodified; assignKaryawan() below keeps them in sync going forward.
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS formasi_id TEXT REFERENCES formasi_jabatan(id);

CREATE TABLE IF NOT EXISTS jalur_jabatan (
  id TEXT PRIMARY KEY,
  jabatan_dari_id TEXT NOT NULL REFERENCES jabatan(id),
  jabatan_ke_id TEXT NOT NULL REFERENCES jabatan(id),
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jabatan_dari_id, jabatan_ke_id)
);

ALTER TABLE deskripsi_kerja ADD COLUMN IF NOT EXISTS jabatan_id TEXT REFERENCES jabatan(id);
ALTER TABLE spesifikasi_kerja ADD COLUMN IF NOT EXISTS jabatan_id TEXT REFERENCES jabatan(id);
