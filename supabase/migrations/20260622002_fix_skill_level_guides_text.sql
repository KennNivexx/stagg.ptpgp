-- Jalankan ini jika tabel skill_level_guides sudah terlanjur dibuat dengan skill_id UUID
-- (terjadi jika migrasi 20260622001 sudah dijalankan sebelum fix)
ALTER TABLE skill_level_guides ALTER COLUMN skill_id TYPE TEXT;
