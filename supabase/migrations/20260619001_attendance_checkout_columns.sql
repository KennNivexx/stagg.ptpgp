-- Attendance: checkout photo + GPS columns (missing from previous migrations)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_photo_url TEXT DEFAULT '';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_latitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_longitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_location_name TEXT DEFAULT '';
