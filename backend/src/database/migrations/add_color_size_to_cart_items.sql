-- Add color and size columns to cart_items
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS color VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS size VARCHAR(50) NULL;

-- Drop old unique constraints (one entry per product, ignoring variant)
ALTER TABLE cart_items
  DROP CONSTRAINT IF EXISTS unique_user_product,
  DROP CONSTRAINT IF EXISTS unique_session_product;

-- Also drop index forms if they exist
DROP INDEX IF EXISTS unique_user_product;
DROP INDEX IF EXISTS unique_session_product;

-- Add new unique constraints that include color + size so variants are separate rows
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product_variant
  ON cart_items (user_id, product_id, COALESCE(color, ''), COALESCE(size, ''))
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_session_product_variant
  ON cart_items (session_id, product_id, COALESCE(color, ''), COALESCE(size, ''))
  WHERE session_id IS NOT NULL;
