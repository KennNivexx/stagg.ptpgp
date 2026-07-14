-- Learning & Training Management: fills Master Data gaps on `pelatihan`
-- (category/method/provider/instructor/room/hours), adds a persisted
-- Training Need Analysis record (previously only ever live-computed on the
-- Gap Analysis page, with no saved status/history), and adds the completely
-- missing Evaluation (Kirkpatrick Reaction/Learning/Behavior/Result) layer.
-- Everything else (pelatihan, peserta_pelatihan, sertifikat_pelatihan,
-- roi_pelatihan, permintaan_pelatihan, the WhatsApp bot's training summary)
-- is untouched.

ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'Offline' CHECK (method IN ('Online','Offline','Blended'));
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS instruktur TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS jenis_instruktur TEXT DEFAULT 'Internal' CHECK (jenis_instruktur IN ('Internal','Eksternal'));
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS lokasi TEXT;
ALTER TABLE pelatihan ADD COLUMN IF NOT EXISTS durasi_jam NUMERIC;

CREATE TABLE IF NOT EXISTS tna_kompetensi (
  id TEXT PRIMARY KEY,
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  skill_id TEXT NOT NULL REFERENCES master_kompetensi(id),
  required_level INTEGER NOT NULL,
  current_level INTEGER NOT NULL,
  gap INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Assigned','Resolved')),
  pelatihan_id TEXT REFERENCES pelatihan(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(karyawan_id, skill_id, status)
);
CREATE INDEX IF NOT EXISTS idx_tna_kompetensi_skill ON tna_kompetensi(skill_id);
CREATE INDEX IF NOT EXISTS idx_tna_kompetensi_status ON tna_kompetensi(status);

CREATE TABLE IF NOT EXISTS evaluasi_pelatihan (
  id TEXT PRIMARY KEY,
  training_id TEXT NOT NULL REFERENCES pelatihan(id),
  karyawan_id UUID NOT NULL REFERENCES karyawan(id),
  reaction_score INTEGER CHECK (reaction_score BETWEEN 1 AND 5),
  learning_score INTEGER CHECK (learning_score BETWEEN 1 AND 5),
  behavior_score INTEGER CHECK (behavior_score BETWEEN 1 AND 5),
  result_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training_id, karyawan_id)
);
