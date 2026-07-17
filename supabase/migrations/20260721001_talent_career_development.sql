-- Career Development & Succession Management Migration
-- Part 2: Talent Management & Career Development Engines

-- 1. Career Profiles (Master record per employee)
CREATE TABLE IF NOT EXISTS career_profiles (
  id TEXT PRIMARY KEY,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  career_stream_id TEXT REFERENCES career_streams(id),
  career_level_id TEXT REFERENCES career_levels(id),
  target_jabatan_id TEXT REFERENCES jabatan(id),
  last_assessment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_career_profiles_karyawan ON career_profiles(karyawan_id);

-- 2. Talent Pools
CREATE TABLE IF NOT EXISTS talent_pools (
  id TEXT PRIMARY KEY,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  current_jabatan_id TEXT REFERENCES jabatan(id),
  target_jabatan_id TEXT NOT NULL REFERENCES jabatan(id),
  status TEXT DEFAULT 'Development' CHECK (status IN ('Development', 'Ready', 'On Hold', 'Promoted')),
  entered_at DATE DEFAULT CURRENT_DATE,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Talent Reviews & 9-Box
CREATE TABLE IF NOT EXISTS talent_reviews (
  id TEXT PRIMARY KEY,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  period TEXT NOT NULL, -- e.g., '2026-H1'
  performance_score NUMERIC NOT NULL DEFAULT 0,
  potential_score NUMERIC NOT NULL DEFAULT 0,
  classification_id TEXT REFERENCES talent_classifications(id),
  reviewer_id TEXT REFERENCES karyawan(id),
  notes TEXT,
  review_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Critical Positions
CREATE TABLE IF NOT EXISTS critical_positions (
  id TEXT PRIMARY KEY,
  jabatan_id TEXT NOT NULL REFERENCES jabatan(id),
  reason TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_critical_positions_jabatan ON critical_positions(jabatan_id);

-- 5. Succession Plans
CREATE TABLE IF NOT EXISTS succession_plans (
  id TEXT PRIMARY KEY,
  critical_position_id TEXT NOT NULL REFERENCES critical_positions(id) ON DELETE CASCADE,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  readiness_status TEXT DEFAULT 'Need Development' CHECK (readiness_status IN ('Ready Now', 'Ready Within 6 Months', 'Ready Within 1 Year', 'Need Development')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Career Assessments (Result from Career Development Engine)
CREATE TABLE IF NOT EXISTS career_assessments (
  id TEXT PRIMARY KEY,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  period TEXT NOT NULL,
  performance_score NUMERIC DEFAULT 0,
  competency_score NUMERIC DEFAULT 0,
  skills_score NUMERIC DEFAULT 0,
  leadership_score NUMERIC DEFAULT 0,
  learning_score NUMERIC DEFAULT 0,
  attendance_score NUMERIC DEFAULT 0,
  discipline_score NUMERIC DEFAULT 0,
  innovation_score NUMERIC DEFAULT 0,
  experience_score NUMERIC DEFAULT 0,
  final_career_score NUMERIC DEFAULT 0,
  readiness_rule_id TEXT REFERENCES career_readiness_rules(id),
  assessment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Individual Development Plans (IDP)
CREATE TABLE IF NOT EXISTS individual_development_plans (
  id TEXT PRIMARY KEY,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  assessment_id TEXT REFERENCES career_assessments(id), -- Optional link to assessment that triggered it
  period TEXT NOT NULL,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'In Progress', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. IDP Items
CREATE TABLE IF NOT EXISTS idp_items (
  id TEXT PRIMARY KEY,
  idp_id TEXT NOT NULL REFERENCES individual_development_plans(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('Training', 'Coaching', 'Mentoring', 'Job Rotation', 'Project Assignment', 'Re-Assessment', 'KPI Development', 'Other')),
  description TEXT NOT NULL,
  target_date DATE,
  pic_karyawan_id TEXT REFERENCES karyawan(id),
  status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Career Recommendations
CREATE TABLE IF NOT EXISTS career_recommendations (
  id TEXT PRIMARY KEY,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  assessment_id TEXT REFERENCES career_assessments(id),
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('Promotion', 'Mutation', 'Rotation', 'Demotion')),
  target_jabatan_id TEXT REFERENCES jabatan(id),
  target_unit_id TEXT REFERENCES unit_organisasi(id),
  reason TEXT,
  status TEXT DEFAULT 'Proposed' CHECK (status IN ('Proposed', 'Approved', 'Rejected', 'Executed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
