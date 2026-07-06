-- Add criteria column to career_promotions for promotion determination tracking
ALTER TABLE career_promotions ADD COLUMN IF NOT EXISTS criteria TEXT;
