-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('superadmin', 'hrd', 'employee')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed superadmin (password: superadmin123)
INSERT INTO users (email, password_hash, role, full_name)
VALUES (
  'superadmin@ptpgp.co.id',
  '46072c81788a79c97ab5b2bbecdcdc2f:3a86a537b6e9609eb277db2dc6c98d8d0b7e5b27709d326028843373714262b1498c4e7134b910b2cc766c393f450c080a15ea427b3beb31fa7ee79b4786f074',
  'superadmin',
  'Super Administrator'
) ON CONFLICT (email) DO UPDATE SET role = 'superadmin', password_hash = EXCLUDED.password_hash;

-- Seed HRD admin (password: password)
INSERT INTO users (email, password_hash, role, full_name)
VALUES (
  'hrd@ptpgp.co.id',
  '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93',
  'hrd',
  'Administrator HRD'
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Seed employee demo (password: password)
INSERT INTO users (email, password_hash, role, full_name)
VALUES (
  'employee@ptpgp.co.id',
  'e502801145654902f032c4f9a62b8366:7b959d9961d1090d6e21aa0e63941c6ccef1f6a8c8b7d7b1f6c47bc7786f0368cbc3f9ecf456203f6ade481ef01f61ee32f515defe9ce29319cda416c7fc2395',
  'employee',
  'Budi Santoso'
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT SELECT ON users TO authenticated;
