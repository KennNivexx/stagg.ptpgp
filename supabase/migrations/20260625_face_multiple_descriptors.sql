-- Store employee name directly to avoid join issues
-- Store all 3 registration photo descriptors for better matching accuracy
ALTER TABLE employee_faces
  ADD COLUMN IF NOT EXISTS descriptors jsonb,
  ADD COLUMN IF NOT EXISTS employee_name text;
