-- ============================================================
-- Encrypted face descriptor columns (AES-256-GCM)
-- Data biometrik wajib dilindungi (UU PDP Pasal 4 ayat 2)
-- ============================================================
ALTER TABLE employee_faces ADD COLUMN IF NOT EXISTS encrypted_descriptor TEXT;
ALTER TABLE employee_faces ADD COLUMN IF NOT EXISTS encrypted_descriptors JSONB;

ALTER TABLE face_change_requests ADD COLUMN IF NOT EXISTS encrypted_descriptor TEXT;
ALTER TABLE face_change_requests ADD COLUMN IF NOT EXISTS encrypted_descriptors JSONB;
