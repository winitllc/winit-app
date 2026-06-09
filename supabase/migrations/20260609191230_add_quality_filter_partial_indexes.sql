-- Partial indexes for each quality filter to make COUNT(*) and ORDER BY fast
CREATE INDEX IF NOT EXISTS idx_products_needs_review
  ON products(status, created_at DESC)
  WHERE name > '' AND ingredients_text > '';

CREATE INDEX IF NOT EXISTS idx_products_missing_ingredients
  ON products(status, created_at DESC)
  WHERE ingredients_text = '';

CREATE INDEX IF NOT EXISTS idx_products_missing_name
  ON products(status, created_at DESC)
  WHERE name = '';

CREATE INDEX IF NOT EXISTS idx_products_user_submitted
  ON products(status, created_at DESC)
  WHERE off_id IS NULL;
