-- Lanjutan modul forwarding: field kebutuhan SIM di Permintaan SDM, lokasi
-- pada laporan insiden (dilaporkan dari HP karyawan), dan pengadaan
-- kendaraan (approval Direktur).

ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS required_license TEXT;

ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS is_sos BOOLEAN NOT NULL DEFAULT false;

-- Pengadaan kendaraan baru — diajukan HRD, disetujui langsung oleh Direktur
-- (bukan lewat alur Permintaan SDM yang khusus headcount/rekrutmen, karena
-- ini keputusan pembelian aset, bukan tenaga kerja).
CREATE TABLE IF NOT EXISTS vehicle_procurement_requests (
  id TEXT PRIMARY KEY,
  requested_by TEXT NOT NULL DEFAULT '',
  vehicle_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  estimated_cost NUMERIC,
  reason TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Disetujui, Ditolak
  approved_by TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_procurement_status ON vehicle_procurement_requests(status);
