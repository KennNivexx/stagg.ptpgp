-- ============================================================
-- Atomic headcount update function
-- Prevents race conditions when multiple approvals overlap
-- ============================================================
CREATE OR REPLACE FUNCTION increment_headcount(dept_name TEXT, amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE departments
  SET headcount = COALESCE(headcount, 0) + amount,
      updated_at = NOW()
  WHERE name = dept_name;
END;
$$ LANGUAGE plpgsql;
