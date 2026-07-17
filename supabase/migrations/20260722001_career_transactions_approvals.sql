-- Career Development & Succession Management Migration
-- Part 3: Transactions & Approvals

-- 1. Career Transactions (Master for all career movements)
CREATE TABLE IF NOT EXISTS career_transactions (
  id TEXT PRIMARY KEY,
  karyawan_id TEXT NOT NULL REFERENCES karyawan(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Promotion', 'Mutation', 'Rotation', 'Demotion', 'Acting Assignment', 'Temporary Assignment', 'Succession Assignment')),
  
  -- Current state capture
  current_jabatan_id TEXT REFERENCES jabatan(id),
  current_unit_id TEXT REFERENCES unit_organisasi(id),
  
  -- Proposed state
  target_jabatan_id TEXT NOT NULL REFERENCES jabatan(id),
  target_unit_id TEXT REFERENCES unit_organisasi(id),
  
  -- Link to recommendation or IDP (optional)
  recommendation_id TEXT REFERENCES career_recommendations(id),
  
  -- Timing
  effective_date DATE NOT NULL,
  end_date DATE, -- For temporary/acting assignments
  
  -- Status
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'In Review', 'Approved', 'Rejected', 'Executed')),
  
  reason TEXT,
  notes TEXT,
  
  created_by UUID REFERENCES pengguna(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Career Approvals (Routing per transaction)
CREATE TABLE IF NOT EXISTS career_approvals (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES career_transactions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL DEFAULT 1,
  
  -- Target Approver (can be a role string or specific user/karyawan)
  approver_role TEXT, -- e.g., 'HR Business Partner', 'Department Head', 'Career Committee'
  approver_karyawan_id TEXT REFERENCES karyawan(id),
  
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  notes TEXT,
  
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(transaction_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_career_transactions_karyawan ON career_transactions(karyawan_id);
CREATE INDEX IF NOT EXISTS idx_career_approvals_transaction ON career_approvals(transaction_id);
