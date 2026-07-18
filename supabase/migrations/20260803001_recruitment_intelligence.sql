-- Recruitment Management enhancements, matching the gap analysis against the
-- client's "Enterprise Recruitment Management" spec. Same principle as the
-- Manpower Request Validation Engine: every score/recommendation below is
-- computed from real data already in this schema (candidate's own
-- experiences/educations/skills from the application form, job requirements,
-- existing test scores, grade/salary band) — nothing fabricated, no ML.
--
-- NOT included: multi-panel interview scoring, multi-step Hiring Approval
-- chain, Background Check / Medical Check Up, digital-signature Offer Letter
-- — those need real UI/workflow design decisions beyond a schema migration
-- and are left for a follow-up round.

CREATE TABLE IF NOT EXISTS recruitment_channel (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  urutan INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO recruitment_channel (id, code, name, urutan) VALUES
  ('rc-01', 'CAREER_SITE', 'Career Website', 1),
  ('rc-02', 'LINKEDIN',    'LinkedIn', 2),
  ('rc-03', 'JOBSTREET',   'Jobstreet', 3),
  ('rc-04', 'KALIBRR',     'Kalibrr', 4),
  ('rc-05', 'GLINTS',      'Glints', 5),
  ('rc-06', 'KAMPUS',      'Kampus', 6),
  ('rc-07', 'REFERENSI',   'Referensi Karyawan', 7),
  ('rc-08', 'WALKIN',      'Walk In', 8)
ON CONFLICT (code) DO NOTHING;

-- One threshold row per pipeline stage — "Recruitment SLA" master data.
CREATE TABLE IF NOT EXISTS recruitment_sla_config (
  id TEXT PRIMARY KEY,
  stage TEXT UNIQUE NOT NULL,
  threshold_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO recruitment_sla_config (id, stage, threshold_days) VALUES
  ('sla-01', 'Menunggu Review', 3),
  ('sla-02', 'Test',            5),
  ('sla-03', 'Interview',       7),
  ('sla-04', 'Wawancara',       7),
  ('sla-05', 'Negosiasi',       5)
ON CONFLICT (stage) DO NOTHING;

ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS channel_id TEXT REFERENCES recruitment_channel(id);
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS match_score NUMERIC;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS match_detail JSONB;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS final_score NUMERIC;
ALTER TABLE pelamar ADD COLUMN IF NOT EXISTS final_score_detail JSONB;
