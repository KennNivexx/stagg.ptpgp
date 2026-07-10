-- Geofenced attendance: titik koordinat + radius per lokasi kerja, kolom
-- audit jarak di attendance, dan tabel Perjalanan Dinas (dengan approval)
-- yang mengecualikan karyawan dari cek radius selama masa dinasnya.

-- Titik koordinat & radius geofence per lokasi kerja. Kalau lat/lng masih
-- NULL (belum diisi HRD), geofence untuk lokasi itu dianggap belum
-- dikonfigurasi dan absensi tetap diizinkan (fail-open) — lihat src/lib/geofence.ts.
ALTER TABLE work_locations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE work_locations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE work_locations ADD COLUMN IF NOT EXISTS radius_meters INTEGER NOT NULL DEFAULT 200;

-- Audit jarak & status geofence per absensi (diisi otomatis oleh clockInForEmployee/clockOutForEmployee)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS distance_meters NUMERIC;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS within_geofence BOOLEAN;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_business_trip BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_distance_meters NUMERIC;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_within_geofence BOOLEAN;

-- Perjalanan Dinas (business trip) — pola sama seperti leave_requests: karyawan
-- mengajukan, atasan departemen menyetujui/menolak. Selama tanggal dinas
-- aktif & disetujui, karyawan dikecualikan dari cek geofence lokasi kerja.
CREATE TABLE IF NOT EXISTS business_trips (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL DEFAULT '',
  department TEXT DEFAULT '',
  destination TEXT NOT NULL,
  destination_latitude DOUBLE PRECISION,
  destination_longitude DOUBLE PRECISION,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  approved_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_trips_employee ON business_trips(employee_id);
CREATE INDEX IF NOT EXISTS idx_business_trips_dates ON business_trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_business_trips_status ON business_trips(status);
