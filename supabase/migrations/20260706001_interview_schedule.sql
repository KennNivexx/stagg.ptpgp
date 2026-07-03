-- Add interview scheduling columns to applications so HRD can schedule and
-- display interview date/time/notes per applicant (used by
-- src/app/hrd/recruitment/interviews/page.tsx).
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS interview_date TEXT,
  ADD COLUMN IF NOT EXISTS interview_time TEXT,
  ADD COLUMN IF NOT EXISTS interviewer TEXT,
  ADD COLUMN IF NOT EXISTS interview_location TEXT,
  ADD COLUMN IF NOT EXISTS interview_online_link TEXT,
  ADD COLUMN IF NOT EXISTS interview_notes TEXT;

-- Index to support sorting/filtering the calendar/date view
CREATE INDEX IF NOT EXISTS idx_applications_interview_date ON applications (interview_date);
