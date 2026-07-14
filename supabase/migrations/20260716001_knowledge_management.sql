-- Knowledge Management: maps existing knowledge content (dokumen_sop,
-- kebijakan_perusahaan, artikel_pengetahuan, video_pelatihan — none of
-- which were ever linked to a competency) to master_kompetensi, and fills
-- lifecycle/metadata gaps (status, version, SME, effective/expiry dates,
-- mandatory flag, media type). No content table is dropped or restructured.

-- Polymorphic mapping (content lives across 4 different tables, so one
-- generic table beats four separate FK columns).
CREATE TABLE IF NOT EXISTS pemetaan_pengetahuan (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('sop','kebijakan','artikel','video')),
  content_id TEXT NOT NULL,
  skill_id TEXT NOT NULL REFERENCES master_kompetensi(id),
  wajib BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_pemetaan_pengetahuan_skill ON pemetaan_pengetahuan(skill_id);

-- Status is left as free TEXT (no CHECK) — UI values: Draft, Review,
-- Approval, Published, Mandatory, Revision, Archived, Obsolete — so the
-- existing dokumen_sop rows already at 'Aktif' never fail validation.
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS sme TEXT;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE dokumen_sop ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'PDF';

ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE kebijakan_perusahaan ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'PDF';

ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0';
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE artikel_pengetahuan ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'HTML';

ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0';
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS sme TEXT;
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'MP4';
ALTER TABLE video_pelatihan ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
