-- Generic standalone table for Employee 360° categories that used to just
-- link out to an existing module ("Kelola di Pelatihan", etc). One flexible
-- table instead of one bespoke table per category — keyed by email only, no
-- FK, same "berdiri sendiri" pattern as data_pribadi_karyawan/keluarga_karyawan.
-- `kategori` distinguishes which Employee 360° section a row belongs to
-- (e.g. 'sertifikasi', 'pelatihan') so one table can back many sections.
CREATE TABLE IF NOT EXISTS catatan_karyawan (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  kategori TEXT NOT NULL,
  judul TEXT NOT NULL,
  subjudul TEXT,
  tanggal TEXT,
  status TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_catatan_karyawan_email_kategori ON catatan_karyawan(email, kategori);
