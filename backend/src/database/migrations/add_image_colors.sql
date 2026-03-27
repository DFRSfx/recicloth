-- Add image_colors column to products table to store image-to-color mappings
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_colors JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_image_colors ON products USING GIN (image_colors);
