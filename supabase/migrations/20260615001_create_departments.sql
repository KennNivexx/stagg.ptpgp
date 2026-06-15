-- Add missing columns to existing departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_code TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS leader_name TEXT DEFAULT '';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS leader_email TEXT DEFAULT '';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint on code
DO $$ BEGIN
  ALTER TABLE departments ADD CONSTRAINT departments_code_unique UNIQUE (code);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_departments_parent_code ON departments(parent_code);
CREATE INDEX IF NOT EXISTS idx_departments_level ON departments(level);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
