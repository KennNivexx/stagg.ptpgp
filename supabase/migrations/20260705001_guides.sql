-- User guides / help content, managed by HRD, shown per-role across portals.
-- role must be one of: hrd, employee, applicant, department_manager, director
-- (never superadmin — HRD is not allowed to manage superadmin guides).
CREATE TABLE IF NOT EXISTS guides (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  category TEXT DEFAULT 'Umum',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_role ON guides(role);
