-- Fix: ensure ALL attendance columns exist (safe to run multiple times)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS employee_name TEXT NOT NULL DEFAULT '';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_name TEXT DEFAULT '';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_photo_url TEXT DEFAULT '';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_latitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_longitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS checkout_location_name TEXT DEFAULT '';

-- Reload PostgREST schema cache so Supabase API sees the new columns immediately
NOTIFY pgrst, 'reload schema';
