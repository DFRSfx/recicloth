-- Migration: Create favorites/wishlist table
-- Date: 2025-01-29

-- Create favorites table to store user wishlist/favorites
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  session_id VARCHAR(255) NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

  -- Ensure a user/session can only favorite a product once
  UNIQUE KEY unique_user_product (user_id, product_id),
  UNIQUE KEY unique_session_product (session_id, product_id),

  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add constraints
ALTER TABLE favorites
  ADD CONSTRAINT chk_fav_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Verify the table
DESCRIBE favorites;
