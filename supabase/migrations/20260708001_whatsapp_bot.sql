-- WhatsApp bot integration: employees opt in once from Profil Saya, then
-- interact with an HR menu bot over WhatsApp. Apply via: Supabase Dashboard >
-- SQL Editor. Does NOT touch system_settings — that table already exists
-- (20260621002_hrd_tables.sql) and is reused for wa_* credential keys via
-- the existing getSettings()/saveMultipleSettings() actions in admin.ts.

ALTER TABLE employees ADD COLUMN IF NOT EXISTS wa_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS wa_connected_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS wa_opted_out BOOLEAN DEFAULT FALSE;

-- Partial unique index (not a table-level UNIQUE constraint) so multiple NULLs
-- (employees who haven't registered a number yet) are allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_wa_number
  ON employees(wa_number) WHERE wa_number IS NOT NULL;

-- One row per employee: tracks which multi-step flow (if any) they're
-- currently in, so replies can be interpreted in context instead of always
-- being routed back to the main menu.
CREATE TABLE IF NOT EXISTS wa_conversations (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  wa_number TEXT NOT NULL,
  current_menu TEXT,
  current_flow TEXT,
  flow_data JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  session_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_conversations_wa_number ON wa_conversations(wa_number);

-- Idempotency guard (Meta retries webhook deliveries on non-2xx/slow
-- responses) + audit trail. wa_message_id is Meta's own message id, so the
-- UNIQUE constraint IS the dedup mechanism: insert first, if it conflicts
-- the delivery was already processed — skip business logic, just ack 200.
CREATE TABLE IF NOT EXISTS wa_message_log (
  id TEXT PRIMARY KEY,
  wa_message_id TEXT NOT NULL UNIQUE,
  wa_number TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_message_log_wa_number ON wa_message_log(wa_number);
