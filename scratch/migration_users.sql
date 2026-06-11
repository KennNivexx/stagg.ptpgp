-- ================================================================
-- SQL Migration: Users Table, KPI Table & Seed Data
-- Jalankan script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/oglodtarxmcwvjaehsbb/sql
-- ================================================================

-- 1. Buat tabel users (untuk autentikasi login)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('hrd', 'employee')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Buat tabel kpi_evaluations (untuk penilaian kinerja)
CREATE TABLE IF NOT EXISTS kpi_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES employees(id),
  period TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  comments TEXT,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Grant appropriate permissions (NOT all to anon!)
GRANT ALL ON users TO service_role;
GRANT SELECT ON users TO authenticated;
GRANT ALL ON kpi_evaluations TO service_role;
GRANT SELECT ON kpi_evaluations TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. Seed admin HRD (password: password)
INSERT INTO users (email, password_hash, role, full_name)
VALUES (
  'hrd@ptpgp.co.id',
  '7f0f87661411182e92ad61f279830bd9:516098fbe00c966163315f0f9d00d862d300766c220bb2a1ae0ffc54e867a1b499ac0f6cb950bb4d746b2c67b523853d18bfb61be24a68f91229223590b815ca',
  'hrd',
  'Administrator HRD'
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 5. Seed employee demo (password: password)
INSERT INTO users (email, password_hash, role, full_name)
VALUES (
  'employee@ptpgp.co.id',
  'e07c8f9690bc5745337b82d5a5fe614d:6977adc27fee589bc47df1c8c646a74520cfd90530748ccda35a17f16e474120e4f96eb090ed31083f7f10c2cf5470523d692eda24b89f209329f8feb743391c',
  'employee',
  'Budi Santoso'
) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
