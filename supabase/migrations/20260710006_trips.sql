-- Pencatatan trip supir — dasar untuk rekap jam mengemudi (fatigue
-- compliance) dan insentif trip-based. Insentif yang di-generate dari sini
-- masuk ke tabel incentive_payments yang SUDAH ADA (type='incentive'),
-- supaya otomatis kebawa ke payroll run tanpa perlu ubah engine payroll.
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,          -- employees.id
  driver_name TEXT NOT NULL DEFAULT '',
  department TEXT DEFAULT '',
  vehicle_id TEXT,                  -- vehicles.id, nullable
  vehicle_plate TEXT DEFAULT '',
  origin TEXT DEFAULT '',
  destination TEXT NOT NULL,
  trip_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  distance_km NUMERIC,
  rate_per_km NUMERIC NOT NULL DEFAULT 2000,
  status TEXT NOT NULL DEFAULT 'Berjalan', -- Berjalan, Selesai, Dibatalkan
  incentive_generated BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
