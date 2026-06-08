-- Drop old partial indexes that used IS NULL (data uses empty strings, not NULLs)
DROP INDEX IF EXISTS idx_products_pending_name_null;
DROP INDEX IF EXISTS idx_products_pending_ingredients_null;
DROP INDEX IF EXISTS idx_products_pending_needs_review;

-- Correct partial indexes matching empty strings
CREATE INDEX IF NOT EXISTS idx_products_pending_name_empty
  ON products(id) WHERE status = 'pending' AND name = '';

CREATE INDEX IF NOT EXISTS idx_products_pending_ingredients_empty
  ON products(id) WHERE status = 'pending' AND ingredients_text = '';

CREATE INDEX IF NOT EXISTS idx_products_pending_needs_review
  ON products(id) WHERE status = 'pending' AND name <> '' AND ingredients_text <> '';
