-- Schedule permanent account deletion 24h after a resignation is approved.
-- When HRD sets a resignation to "Disetujui", delete_at is set to now()+24h.
-- A lazy purge (on login + notification poll) permanently removes the account
-- once delete_at has passed.
ALTER TABLE resignations
  ADD COLUMN IF NOT EXISTS delete_at timestamptz;
