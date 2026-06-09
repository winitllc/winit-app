CREATE OR REPLACE FUNCTION get_quality_filter_counts(p_status text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'missing_name',        (
      SELECT COUNT(*) FROM products
      WHERE (p_status IS NULL OR status = p_status)
        AND (name IS NULL OR name = '')
    ),
    'missing_ingredients', (
      SELECT COUNT(*) FROM products
      WHERE (p_status IS NULL OR status = p_status)
        AND (ingredients_text IS NULL OR ingredients_text = '')
    ),
    'needs_review',        (
      SELECT COUNT(*) FROM products
      WHERE (p_status IS NULL OR status = p_status)
        AND name IS NOT NULL AND name != ''
        AND ingredients_text IS NOT NULL AND ingredients_text != ''
    ),
    'user_submitted',      (
      SELECT COUNT(*) FROM products
      WHERE (p_status IS NULL OR status = p_status)
        AND off_id IS NULL
    )
  );
$$;
GRANT EXECUTE ON FUNCTION get_quality_filter_counts(text) TO anon;
