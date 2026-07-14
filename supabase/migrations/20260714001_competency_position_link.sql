-- Competency Management tied to Position: kompetensi_jabatan was matched to
-- karyawan.position by free-text equality (position_code == karyawan.position),
-- never to jabatan.id/formasi_jabatan — the exact "competency follows the
-- position, not the individual" principle this was supposed to enforce.
-- Additive only: position_code stays as a fallback match for employees not
-- yet assigned via Position Management.

ALTER TABLE kompetensi_jabatan ADD COLUMN IF NOT EXISTS jabatan_id TEXT REFERENCES jabatan(id);
ALTER TABLE master_kompetensi ADD COLUMN IF NOT EXISTS jenis_kompetensi TEXT DEFAULT 'Hard Skill' CHECK (jenis_kompetensi IN ('Hard Skill','Soft Skill'));
ALTER TABLE rencana_pengembangan ADD COLUMN IF NOT EXISTS skill_id TEXT REFERENCES master_kompetensi(id);
ALTER TABLE rencana_pengembangan ADD COLUMN IF NOT EXISTS jenis_aksi TEXT DEFAULT 'Training' CHECK (jenis_aksi IN ('Coaching','Mentoring','OJT','Training','Sertifikasi'));
ALTER TABLE rencana_pengembangan ADD COLUMN IF NOT EXISTS gap_value INTEGER;
