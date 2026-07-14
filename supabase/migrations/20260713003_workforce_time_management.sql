-- Workforce Time Management: fills the genuinely missing operational
-- capabilities (timesheet, overtime, attendance correction, project/site
-- assignment, work calendar, leave balance) on top of the attendance/leave
-- infrastructure that already exists (absensi, pengajuan_cuti, shift_kerja,
-- jadwal_shift, lokasi_kerja w/ geofence — all still used by the WhatsApp
-- bot, untouched here). No new organization master data: penugasan_kerja
-- references karyawan/unit_organisasi rather than re-inventing them.

CREATE TABLE IF NOT EXISTS kalender_kerja (
  id TEXT PRIMARY KEY,
  tanggal DATE NOT NULL,
  nama_libur TEXT NOT NULL,
  jenis TEXT NOT NULL DEFAULT 'Nasional' CHECK (jenis IN ('Nasional','Perusahaan','Cuti Bersama')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS penugasan_kerja (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  unit_organisasi_id TEXT REFERENCES unit_organisasi(id),
  nama_project TEXT,
  nama_klien TEXT,
  supervisor_karyawan_id UUID REFERENCES karyawan(id),
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Selesai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS koreksi_absensi (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  tanggal DATE NOT NULL,
  jenis_koreksi TEXT NOT NULL,
  alasan TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Disetujui','Ditolak')),
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lembur (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  tanggal DATE NOT NULL,
  jam_mulai TEXT,
  jam_selesai TEXT,
  alasan TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Disetujui','Ditolak')),
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catatan_aktivitas_harian (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  tanggal DATE NOT NULL,
  jam_mulai TEXT,
  jam_selesai TEXT,
  deskripsi_aktivitas TEXT NOT NULL,
  project_site TEXT,
  jam_kerja NUMERIC,
  mode_kerja TEXT DEFAULT 'Kantor' CHECK (mode_kerja IN ('Kantor','WFH','Dinas Luar')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saldo_cuti (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  tahun INTEGER NOT NULL,
  jenis_cuti TEXT NOT NULL DEFAULT 'Tahunan',
  total_hari INTEGER DEFAULT 12,
  terpakai INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(karyawan_id, tahun, jenis_cuti)
);

CREATE INDEX IF NOT EXISTS idx_penugasan_kerja_emp ON penugasan_kerja(karyawan_id);
CREATE INDEX IF NOT EXISTS idx_koreksi_absensi_emp ON koreksi_absensi(karyawan_id);
CREATE INDEX IF NOT EXISTS idx_lembur_emp ON lembur(karyawan_id);
CREATE INDEX IF NOT EXISTS idx_aktivitas_harian_emp ON catatan_aktivitas_harian(karyawan_id);
