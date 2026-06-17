CREATE TABLE IF NOT EXISTS org_units (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_code TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  leader_name TEXT DEFAULT '',
  leader_email TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_units_parent ON org_units(parent_code);
CREATE INDEX IF NOT EXISTS idx_org_units_level ON org_units(level);
CREATE INDEX IF NOT EXISTS idx_org_units_code ON org_units(code);
