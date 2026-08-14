-- Struktur Organisasi (SK) snapshot column.
--
-- approveStruktur() previously only flipped struktur_organisasi_versi.status
-- to "Approved" — it never touched unit_organisasi/jabatan, so the "official"
-- SK and the live org structure could silently drift apart with no way to
-- tell. This column stores a snapshot of buildTree()'s output at the moment
-- a version is approved, so getStrukturSyncStatus() can compare it against
-- the current live tree and surface an "in sync" / "drifted" banner.
--
-- Apply via: Supabase Dashboard > SQL Editor

alter table struktur_organisasi_versi add column if not exists snapshot_data jsonb;
