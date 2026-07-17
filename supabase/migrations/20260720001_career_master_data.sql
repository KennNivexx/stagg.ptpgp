-- Career Development & Succession Management: Master Data Migration
-- Part 1: Foundations (Framework, Streams, Levels, Policies, Scoring)

-- 1. Career Framework
CREATE TABLE IF NOT EXISTS career_frameworks (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  effective_date DATE NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Active','Archived')),
  description TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Career Stream
CREATE TABLE IF NOT EXISTS career_streams (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Career Streams
INSERT INTO career_streams (id, code, name, description) VALUES
  ('str-01', 'CS01', 'Management', 'Jalur struktural dan manajerial'),
  ('str-02', 'CS02', 'Professional', 'Jalur profesional/fungsional umum'),
  ('str-03', 'CS03', 'Technical Expert', 'Jalur keahlian teknis spesifik'),
  ('str-04', 'CS04', 'Operational', 'Jalur operasional lapangan'),
  ('str-05', 'CS05', 'Sales', 'Jalur penjualan dan pemasaran'),
  ('str-06', 'CS06', 'Project', 'Jalur manajemen proyek')
ON CONFLICT (code) DO NOTHING;

-- 3. Career Level
CREATE TABLE IF NOT EXISTS career_levels (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Career Levels
INSERT INTO career_levels (id, code, name, urutan) VALUES
  ('lvl-01', 'LVL01', 'Intern', 1),
  ('lvl-02', 'LVL02', 'Junior', 2),
  ('lvl-03', 'LVL03', 'Staff', 3),
  ('lvl-04', 'LVL04', 'Senior Staff', 4),
  ('lvl-05', 'LVL05', 'Supervisor', 5),
  ('lvl-06', 'LVL06', 'Assistant Manager', 6),
  ('lvl-07', 'LVL07', 'Manager', 7),
  ('lvl-08', 'LVL08', 'Senior Manager', 8),
  ('lvl-09', 'LVL09', 'General Manager', 9),
  ('lvl-10', 'LVL10', 'Director', 10)
ON CONFLICT (code) DO NOTHING;

-- 4. Promotion Policy
CREATE TABLE IF NOT EXISTS promotion_policies (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL REFERENCES career_frameworks(id),
  minimum_grade TEXT REFERENCES grade_jabatan(id), -- Nullable in case it's generic
  min_performance_score NUMERIC DEFAULT 0,
  min_competency_score NUMERIC DEFAULT 0,
  min_leadership_score NUMERIC DEFAULT 0,
  mandatory_training_pct NUMERIC DEFAULT 100,
  min_attendance_pct NUMERIC DEFAULT 95,
  allow_active_warning BOOLEAN DEFAULT FALSE,
  must_pass_assessment BOOLEAN DEFAULT TRUE,
  require_vacant_position BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Mutation Policy
CREATE TABLE IF NOT EXISTS mutation_policies (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL REFERENCES career_frameworks(id),
  min_tenure_months INTEGER DEFAULT 12,
  min_performance_score NUMERIC DEFAULT 0,
  allow_cross_stream BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Rotation Policy
CREATE TABLE IF NOT EXISTS rotation_policies (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL REFERENCES career_frameworks(id),
  max_tenure_months INTEGER DEFAULT 36,
  mandatory_for_talent BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Succession Policy
CREATE TABLE IF NOT EXISTS succession_policies (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL REFERENCES career_frameworks(id),
  min_readiness_score NUMERIC DEFAULT 80,
  max_successors_per_position INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Leadership Framework
CREATE TABLE IF NOT EXISTS leadership_frameworks (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leadership_competencies (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL REFERENCES leadership_frameworks(id) ON DELETE CASCADE,
  kompetensi_id TEXT NOT NULL REFERENCES master_kompetensi(id),
  required_level INTEGER NOT NULL DEFAULT 0,
  weight_pct NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Talent Classification (9-Box Matrix setup)
CREATE TABLE IF NOT EXISTS talent_classifications (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  performance_min NUMERIC NOT NULL,
  performance_max NUMERIC NOT NULL,
  potential_min NUMERIC NOT NULL,
  potential_max NUMERIC NOT NULL,
  color_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 9-box classifications (Typical example)
INSERT INTO talent_classifications (id, code, name, performance_min, performance_max, potential_min, potential_max, color_code) VALUES
  ('tcl-1', 'HP', 'High Potential', 85, 100, 85, 100, '#10b981'), -- Green
  ('tcl-2', 'EL', 'Emerging Leader', 70, 85, 85, 100, '#3b82f6'), -- Blue
  ('tcl-3', 'SP', 'Solid Performer', 85, 100, 70, 85, '#6366f1'), -- Indigo
  ('tcl-4', 'CC', 'Core Contributor', 70, 85, 70, 85, '#eab308'), -- Yellow
  ('tcl-5', 'ND', 'Need Development', 0, 70, 0, 70, '#ef4444') -- Red
ON CONFLICT (code) DO NOTHING;

-- 10. Career Score Formula
CREATE TABLE IF NOT EXISTS career_score_formulas (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL REFERENCES career_frameworks(id),
  performance_weight_pct NUMERIC DEFAULT 25,
  competency_weight_pct NUMERIC DEFAULT 20,
  skills_weight_pct NUMERIC DEFAULT 10,
  leadership_weight_pct NUMERIC DEFAULT 10,
  learning_weight_pct NUMERIC DEFAULT 10,
  attendance_weight_pct NUMERIC DEFAULT 5,
  discipline_weight_pct NUMERIC DEFAULT 5,
  innovation_weight_pct NUMERIC DEFAULT 5,
  experience_weight_pct NUMERIC DEFAULT 5,
  assessment_weight_pct NUMERIC DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Career Readiness Rules
CREATE TABLE IF NOT EXISTS career_readiness_rules (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL REFERENCES career_frameworks(id),
  category_name TEXT NOT NULL, -- e.g. "Ready Now", "Need Development"
  min_score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  description TEXT,
  color_code TEXT,
  urutan INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a default Career Framework (Draft) to have a starting point
INSERT INTO career_frameworks (id, code, name, effective_date, status, description)
VALUES ('frm-01', 'CF-2026', 'Standard Career Framework 2026', CURRENT_DATE, 'Draft', 'Default framework configuration for the company.')
ON CONFLICT (code) DO NOTHING;

-- Seed default Career Score Formula for the default framework
INSERT INTO career_score_formulas (id, framework_id)
VALUES ('csf-01', 'frm-01')
ON CONFLICT (id) DO NOTHING;

-- Seed default Career Readiness Rules
INSERT INTO career_readiness_rules (id, framework_id, category_name, min_score, max_score, urutan, color_code) VALUES
  ('crr-1', 'frm-01', 'Ready Now', 90, 100, 1, '#10b981'),
  ('crr-2', 'frm-01', 'Ready Within 6 Months', 80, 89.99, 2, '#3b82f6'),
  ('crr-3', 'frm-01', 'Ready Within 1 Year', 70, 79.99, 3, '#eab308'),
  ('crr-4', 'frm-01', 'Need Development', 50, 69.99, 4, '#f97316'),
  ('crr-5', 'frm-01', 'Not Eligible', 0, 49.99, 5, '#ef4444')
ON CONFLICT (id) DO NOTHING;
