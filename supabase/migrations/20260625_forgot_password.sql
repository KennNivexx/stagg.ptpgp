CREATE TABLE IF NOT EXISTS password_reset_otps (
  id text PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  step text NOT NULL DEFAULT 'otp_sent',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
