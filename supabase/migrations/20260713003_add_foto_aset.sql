-- Add foto_url to aset_karyawan for asset photos
ALTER TABLE aset_karyawan ADD COLUMN IF NOT EXISTS foto_url TEXT;
