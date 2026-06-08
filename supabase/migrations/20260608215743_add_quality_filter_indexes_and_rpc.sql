-- Partial indexes to make quality filter counts instant
CREATE INDEX IF NOT EXISTS idx_products_pending_name_null
  ON products(id) WHERE status = 'pending' AND name IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_pending_ingredients_null
  ON products(id) WHERE status = 'pending' AND ingredients_text IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_pending_off_id_null
  ON products(id) WHERE status = 'pending' AND off_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_pending_needs_review
  ON products(id) WHERE status = 'pending' AND name IS NOT NULL AND ingredients_text IS NOT NULL;

-- RPC to return all quality filter counts for pending products in one query
CREATE OR REPLACE FUNCTION get_quality_filter_counts()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'missing_name',        (SELECT COUNT(*) FROM products WHERE status = 'pending' AND (name IS NULL OR name = '')),
    'missing_ingredients', (SELECT COUNT(*) FROM products WHERE status = 'pending' AND (ingredients_text IS NULL OR ingredients_text = '')),
    'needs_review',        (SELECT COUNT(*) FROM products WHERE status = 'pending' AND name IS NOT NULL AND name <> '' AND ingredients_text IS NOT NULL AND ingredients_text <> ''),
    'user_submitted',      (SELECT COUNT(*) FROM products WHERE status = 'pending' AND off_id IS NULL)
  );
$$;

GRANT EXECUTE ON FUNCTION get_quality_filter_counts() TO anon;
