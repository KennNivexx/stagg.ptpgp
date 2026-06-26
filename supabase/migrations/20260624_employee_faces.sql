-- Employee face descriptors for face recognition attendance
CREATE TABLE IF NOT EXISTS employee_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  descriptor FLOAT[] NOT NULL,
  photo_count INTEGER DEFAULT 1,
  photo_url TEXT DEFAULT '',
  confidence_score FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_faces_employee_id ON employee_faces(employee_id);
