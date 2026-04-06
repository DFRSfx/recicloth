-- Add bilingual columns to hero_slides
-- Existing title/description/button_text columns are kept as fallback

ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS title_pt VARCHAR(255),
  ADD COLUMN IF NOT EXISTS title_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description_pt TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS button_text_pt VARCHAR(100),
  ADD COLUMN IF NOT EXISTS button_text_en VARCHAR(100);

-- Backfill PT columns from existing data (treat existing content as Portuguese)
UPDATE hero_slides
SET
  title_pt = title,
  description_pt = description,
  button_text_pt = button_text
WHERE title_pt IS NULL;
