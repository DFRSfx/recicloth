-- 1. Add color + size to order_items
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS color VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS size VARCHAR(50) NULL;

-- 2. Fix cart_items: drop ALL unique constraints (regardless of name) and recreate
-- Drop every unique constraint on cart_items found via catalog
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'cart_items'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE 'ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Also drop any plain unique indexes by name (from previous migration attempts)
DROP INDEX IF EXISTS unique_user_product;
DROP INDEX IF EXISTS unique_session_product;
DROP INDEX IF EXISTS unique_user_product_variant;
DROP INDEX IF EXISTS unique_session_product_variant;

-- Recreate unique indexes that include color + size
CREATE UNIQUE INDEX unique_user_product_variant
  ON cart_items (user_id, product_id, COALESCE(color, ''), COALESCE(size, ''))
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX unique_session_product_variant
  ON cart_items (session_id, product_id, COALESCE(color, ''), COALESCE(size, ''))
  WHERE session_id IS NOT NULL;
