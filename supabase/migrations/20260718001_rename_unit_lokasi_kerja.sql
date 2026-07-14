-- unit_organisasi.lokasi_kerja (a free-text "proposed location" field on the
-- org-design/unit-structure feature) shared its name with the unrelated
-- lokasi_kerja table (employee work-location assignment, karyawan.location_id).
-- The two were never joined and caused no functional bug, but the identical
-- name is confusing to maintainers. Renamed to lokasi_unit_kerja.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'unit_organisasi' AND column_name = 'lokasi_kerja'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'unit_organisasi' AND column_name = 'lokasi_unit_kerja'
  ) THEN
    ALTER TABLE unit_organisasi RENAME COLUMN lokasi_kerja TO lokasi_unit_kerja;
  END IF;
END $$;

ALTER TABLE unit_organisasi ADD COLUMN IF NOT EXISTS lokasi_unit_kerja TEXT;
