-- Tata Kelola Rapat (Meeting Governance) module — 3 previously-missing SOPs
-- bundled together since the source documents treat them as cross-cutting
-- forms used by many other procedures (training, 5R socialization,
-- briefings, MPP discussions, etc):
--   1) SOP-SDM-09        Pengendalian Ruang Meeting (room booking)
--   2) FR-PR-MRE-06-02   Daftar Hadir (attendance sheet)
--   3) FR-PR-MRE-06-03   Notulen Rapat (meeting minutes)
-- All CREATE TABLE IF NOT EXISTS, no destructive statements.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Pengendalian Ruang Meeting
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ruang_meeting (
  id text PRIMARY KEY,
  nama text NOT NULL,
  kapasitas integer,
  status text NOT NULL DEFAULT 'Tersedia' CHECK (status IN ('Tersedia', 'Perlu Dibersihkan', 'Non-Aktif')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_ruang_meeting (
  id text PRIMARY KEY,
  ruang_id text NOT NULL REFERENCES ruang_meeting(id) ON DELETE CASCADE,
  user_pemohon text NOT NULL,
  nama_acara text NOT NULL,
  tanggal date NOT NULL,
  waktu_mulai time NOT NULL,
  waktu_selesai time NOT NULL,
  kebutuhan_snack boolean NOT NULL DEFAULT false,
  catatan_snack text,
  status text NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Dikonfirmasi', 'Ditolak', 'Selesai', 'Kedaluwarsa')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_ruang_meeting_ruang_tanggal ON booking_ruang_meeting(ruang_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_booking_ruang_meeting_status ON booking_ruang_meeting(status);

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Daftar Hadir
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daftar_hadir (
  id text PRIMARY KEY,
  nama_acara text NOT NULL,
  tanggal date NOT NULL,
  tempat text,
  waktu text,
  terkait_agenda text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daftar_hadir_peserta (
  id text PRIMARY KEY,
  daftar_hadir_id text NOT NULL REFERENCES daftar_hadir(id) ON DELETE CASCADE,
  nama text NOT NULL,
  divisi text,
  hadir boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daftar_hadir_peserta_daftar_hadir_id ON daftar_hadir_peserta(daftar_hadir_id);
CREATE INDEX IF NOT EXISTS idx_daftar_hadir_tanggal ON daftar_hadir(tanggal);

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Notulen Rapat
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notulen_rapat (
  id text PRIMARY KEY,
  nama_acara text NOT NULL,
  tanggal date NOT NULL,
  tempat text,
  waktu text,
  agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  dibuat_oleh text,
  disetujui_oleh text,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Menunggu Persetujuan', 'Disetujui')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notulen_rapat_item (
  id text PRIMARY KEY,
  notulen_id text NOT NULL REFERENCES notulen_rapat(id) ON DELETE CASCADE,
  nomor integer NOT NULL DEFAULT 1,
  catatan_pembahasan text,
  tindak_lanjut text,
  pic text,
  batas_waktu date,
  catatan_verifikasi text,
  status text NOT NULL DEFAULT 'Belum Selesai' CHECK (status IN ('Belum Selesai', 'Selesai')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notulen_rapat_item_notulen_id ON notulen_rapat_item(notulen_id);
CREATE INDEX IF NOT EXISTS idx_notulen_rapat_tanggal ON notulen_rapat(tanggal);
