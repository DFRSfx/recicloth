-- Supabase migration: product reviews

CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  reviewer_name VARCHAR(100) NOT NULL,
  reviewer_email VARCHAR(100) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  headline VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  size VARCHAR(20),
  color VARCHAR(50),
  fit VARCHAR(50),
  height VARCHAR(50),
  likelihood VARCHAR(20),
  activities TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  moderated_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  moderated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(order_item_id),
  CONSTRAINT product_reviews_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews (status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews (user_id);
