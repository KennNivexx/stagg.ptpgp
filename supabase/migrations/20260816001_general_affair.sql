-- ============================================================================
-- General Affair module — 4 ISO 9001:2015 / ISO 45001:2018 SOPs that had no
-- corresponding feature anywhere in the app (confirmed absent via exhaustive
-- grep). All 4 are owned by the same role (Supervisor GA / Kepala Divisi
-- SDM & Aset) and are grouped together under /hrd/ga/**:
--   1. SOP-SDM-10 Pengendalian Aset          -> aset_perusahaan, permintaan_perbaikan_aset
--   2. PR-PRL-01  Pengendalian Peralatan     -> peralatan_kendaraan, form_pengeluaran_barang
--   3. PR-SDM-07  Pemeliharaan Infrastruktur -> infrastruktur, pemeliharaan_infrastruktur
--   4. PR-SDM-08  Housekeeping & 5R          -> checklist_kebersihan, audit_5r, laporan_ketidaksesuaian
-- Style follows 20260724001_employee_relations.sql: TEXT PKs, per-table
-- DO $$ blocks so one failing CREATE doesn't abort the rest, no destructive
-- statements.
-- ============================================================================

-- Self-heal: an earlier partial run of this same migration can leave a
-- table behind in a broken state (e.g. "audit_5r" existing without its "id"
-- column, which then makes every later CREATE TABLE ... REFERENCES
-- audit_5r(id) fail with "column id does not exist" and, because that
-- failure was silently swallowed by this file's own EXCEPTION handlers,
-- surface only as a confusing downstream "relation ... does not exist" on
-- an unrelated CREATE INDEX). This block detects exactly that broken state
-- for every table this migration creates and drops just that table so the
-- CREATE TABLE IF NOT EXISTS below can recreate it correctly. Safe to run
-- repeatedly — it only touches a table if that table exists AND is missing
-- the "id" column, which none of these brand-new tables should ever have
-- real data in yet.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['aset_perusahaan', 'peralatan_kendaraan', 'infrastruktur', 'audit_5r'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t)
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'id') THEN
      EXECUTE format('DROP TABLE %I CASCADE', t);
      RAISE NOTICE 'dropped and will recreate malformed table: %', t;
    END IF;
  END LOOP;
END $$;

-- ── 1. PENGENDALIAN ASET (SOP-SDM-10) ───────────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS aset_perusahaan (
  id TEXT PRIMARY KEY,
  nama_aset TEXT NOT NULL,
  jenis TEXT NOT NULL,
  kode_aset TEXT UNIQUE NOT NULL,
  divisi TEXT,
  unit_organisasi_id TEXT,
  penanggung_jawab TEXT,
  jumlah INTEGER DEFAULT 1,
  kondisi TEXT DEFAULT 'Baik' CHECK (kondisi IN ('Baik','Rusak Ringan','Rusak Berat','Hilang')),
  tanggal_input DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Nonaktif')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped aset_perusahaan: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_aset_perusahaan_divisi ON aset_perusahaan(divisi);
CREATE INDEX IF NOT EXISTS idx_aset_perusahaan_status ON aset_perusahaan(status);

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS permintaan_perbaikan_aset (
  id TEXT PRIMARY KEY,
  asset_id TEXT REFERENCES aset_perusahaan(id),
  jenis_permintaan TEXT NOT NULL CHECK (jenis_permintaan IN ('Perbaikan','Penambahan')),
  alasan TEXT,
  status TEXT DEFAULT 'Diajukan' CHECK (status IN ('Diajukan','Disetujui','Ditolak','Selesai')),
  requested_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped permintaan_perbaikan_aset: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_perbaikan_aset_asset_id ON permintaan_perbaikan_aset(asset_id);
CREATE INDEX IF NOT EXISTS idx_perbaikan_aset_status ON permintaan_perbaikan_aset(status);

-- ── 2. PENGENDALIAN PERALATAN (PR-PRL-01) ───────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS peralatan_kendaraan (
  id TEXT PRIMARY KEY,
  nama_peralatan TEXT NOT NULL,
  jenis TEXT,
  kendaraan_atau_lokasi TEXT,
  jumlah_stok INTEGER DEFAULT 0,
  satuan TEXT DEFAULT 'unit',
  fifo_color TEXT CHECK (fifo_color IN ('Hijau','Kuning','Merah')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped peralatan_kendaraan: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS form_pengeluaran_barang (
  id TEXT PRIMARY KEY,
  peralatan_id TEXT REFERENCES peralatan_kendaraan(id),
  jenis TEXT NOT NULL CHECK (jenis IN ('Peminjaman','Pengeluaran')),
  jumlah INTEGER NOT NULL DEFAULT 1,
  peminjam TEXT,
  tanggal_pinjam DATE DEFAULT CURRENT_DATE,
  tanggal_kembali_rencana DATE,
  tanggal_kembali_aktual DATE,
  status TEXT DEFAULT 'Dipinjam' CHECK (status IN ('Dipinjam','Dikembalikan','Rusak/Hilang')),
  catatan_berita_acara TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped form_pengeluaran_barang: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_fpb_peralatan_id ON form_pengeluaran_barang(peralatan_id);
CREATE INDEX IF NOT EXISTS idx_fpb_status ON form_pengeluaran_barang(status);

-- ── 3. PEMELIHARAAN INFRASTRUKTUR (PR-SDM-07) ───────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS infrastruktur (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  jenis TEXT,
  lokasi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped infrastruktur: %', SQLERRM;
END $$;

-- Single table for both branches of the SOP (Terjadwal/Reaktif) — `jenis`
-- distinguishes them, avoiding two near-identical tables.
DO $$ BEGIN
CREATE TABLE IF NOT EXISTS pemeliharaan_infrastruktur (
  id TEXT PRIMARY KEY,
  infrastruktur_id TEXT REFERENCES infrastruktur(id),
  jenis TEXT NOT NULL CHECK (jenis IN ('Terjadwal','Reaktif')),
  deskripsi TEXT,
  requested_by TEXT,
  tanggal_permintaan DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Diajukan' CHECK (status IN ('Diajukan','Dianalisis','Dikerjakan','Diverifikasi','Selesai')),
  butuh_spare_part BOOLEAN DEFAULT FALSE,
  hasil_verifikasi TEXT CHECK (hasil_verifikasi IN ('Efektif','Belum Efektif')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped pemeliharaan_infrastruktur: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_pemeliharaan_infra_id ON pemeliharaan_infrastruktur(infrastruktur_id);
CREATE INDEX IF NOT EXISTS idx_pemeliharaan_status ON pemeliharaan_infrastruktur(status);

-- ── 4. HOUSEKEEPING & 5R (PR-SDM-08) ────────────────────────────────────────

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS checklist_kebersihan (
  id TEXT PRIMARY KEY,
  ruang_atau_area TEXT NOT NULL,
  tanggal DATE DEFAULT CURRENT_DATE,
  petugas TEXT,
  item_diperiksa JSONB DEFAULT '[]'::jsonb,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped checklist_kebersihan: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS audit_5r (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  tanggal_audit DATE DEFAULT CURRENT_DATE,
  auditor TEXT,
  skor_atau_hasil TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped audit_5r: %', SQLERRM;
END $$;

DO $$ BEGIN
CREATE TABLE IF NOT EXISTS laporan_ketidaksesuaian (
  id TEXT PRIMARY KEY,
  audit_5r_id TEXT REFERENCES audit_5r(id),
  deskripsi TEXT NOT NULL,
  tindak_lanjut TEXT,
  pic TEXT,
  batas_waktu DATE,
  status TEXT DEFAULT 'Terbuka' CHECK (status IN ('Terbuka','Ditindaklanjuti','Ditutup')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skipped laporan_ketidaksesuaian: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_nc_audit_5r_id ON laporan_ketidaksesuaian(audit_5r_id);
CREATE INDEX IF NOT EXISTS idx_nc_status ON laporan_ketidaksesuaian(status);
