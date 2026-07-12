-- Employee 360°: 5 personal-data categories with no prior home anywhere in
-- the schema (education history, family/dependents, project experience,
-- company assets held, personal document library). Everything else the
-- Employee 360° profile shows (payroll, attendance, competency, KPI, ...)
-- already lives in existing tables and is only aggregated here, not copied.

CREATE TABLE IF NOT EXISTS pendidikan_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  jenjang TEXT NOT NULL,
  institusi TEXT NOT NULL,
  jurusan TEXT,
  tahun_lulus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pendidikan_karyawan_emp ON pendidikan_karyawan(karyawan_id);

CREATE TABLE IF NOT EXISTS keluarga_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  nama TEXT NOT NULL,
  hubungan TEXT NOT NULL,
  tanggal_lahir TEXT,
  pekerjaan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_keluarga_karyawan_emp ON keluarga_karyawan(karyawan_id);

CREATE TABLE IF NOT EXISTS pengalaman_proyek_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  nama_proyek TEXT NOT NULL,
  peran TEXT,
  klien TEXT,
  tanggal_mulai TEXT,
  tanggal_selesai TEXT,
  deskripsi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pengalaman_proyek_karyawan_emp ON pengalaman_proyek_karyawan(karyawan_id);

CREATE TABLE IF NOT EXISTS aset_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  nama_aset TEXT NOT NULL,
  kategori TEXT,
  nomor_seri TEXT,
  tanggal_serah TEXT,
  status TEXT DEFAULT 'Dipegang' CHECK (status IN ('Dipegang','Dikembalikan')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aset_karyawan_emp ON aset_karyawan(karyawan_id);

CREATE TABLE IF NOT EXISTS dokumen_karyawan (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  jenis TEXT NOT NULL,
  judul TEXT NOT NULL,
  file_url TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dokumen_karyawan_emp ON dokumen_karyawan(karyawan_id);

ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS bpjs_kesehatan_no TEXT;
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS bpjs_tk_no TEXT;
