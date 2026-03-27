-- Add weight field to products table (in grams)
-- Run this migration in Supabase SQL editor if you have existing data

ALTER TABLE products ADD COLUMN IF NOT EXISTS weight INTEGER CHECK (weight > 0);

-- If you need to update existing products with a default weight, run:
-- UPDATE products SET weight = 500 WHERE weight IS NULL;
-- (Then remove this line from your migration)
