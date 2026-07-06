-- Manajemen Pengetahuan: Kebijakan Perusahaan, Basis Pengetahuan, Video Tutorial
-- Hubungan Karyawan: Survei Karyawan (structured questions + responses)
-- Apply via: Supabase Dashboard > SQL Editor

-- Kebijakan Perusahaan (each card links to its own detail page)
CREATE TABLE IF NOT EXISTS company_policies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  effective_date DATE,
  revision TEXT DEFAULT 'Rev. 1',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basis Pengetahuan (each card links to its own article detail page)
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  author TEXT,
  content TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Tutorial (YouTube-style: watch page + related videos)
CREATE TABLE IF NOT EXISTS training_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  description TEXT,
  views INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survei Karyawan: structured Google-Forms-style questions
ALTER TABLE employee_surveys ADD COLUMN IF NOT EXISTS questions_json JSONB;

-- Survei Karyawan: per-employee responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES employee_surveys(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(survey_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_company_policies_category ON company_policies(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_training_videos_category ON training_videos(category);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
