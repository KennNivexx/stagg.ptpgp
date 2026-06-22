-- Add department column to skills (dept-specific competencies)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS department TEXT DEFAULT NULL;

-- Panduan per level per kompetensi (dibuat HRD)
CREATE TABLE IF NOT EXISTS skill_level_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL,
  department TEXT NOT NULL DEFAULT '',   -- '' = berlaku semua departemen
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  indicators TEXT DEFAULT '',            -- satu indikator per baris
  example TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, department, level)
);
