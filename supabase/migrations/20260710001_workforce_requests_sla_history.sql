-- Jenis Permintaan, Need By Date, Alasan Penolakan + riwayat status/revisi untuk workforce_requests
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS request_type TEXT;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS need_by_date DATE;
ALTER TABLE workforce_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE TABLE IF NOT EXISTS workforce_request_history (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES workforce_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_name TEXT,
  actor_role TEXT,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wrh_request ON workforce_request_history(request_id);
