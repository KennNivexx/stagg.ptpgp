-- WhatsApp verification table: stores in-progress identity verification
-- for unknown numbers before they are linked to an employee record.
CREATE TABLE IF NOT EXISTS wa_verifications (
  wa_number TEXT PRIMARY KEY,
  step TEXT NOT NULL CHECK (step IN ('name', 'jabatan', 'code')),
  name TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
