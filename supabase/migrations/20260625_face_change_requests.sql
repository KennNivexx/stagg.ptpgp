-- Consolidate face-related schema changes

-- Extend employee_faces with stored name and multiple descriptors
ALTER TABLE employee_faces
  ADD COLUMN IF NOT EXISTS descriptors jsonb,
  ADD COLUMN IF NOT EXISTS employee_name text;

-- Face change request workflow
CREATE TABLE IF NOT EXISTS face_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL,
  employee_name text,
  descriptors jsonb NOT NULL,
  descriptor jsonb,
  photo_url text,
  photo_count integer DEFAULT 3,
  status text NOT NULL DEFAULT 'Pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz,
  notes text
);
