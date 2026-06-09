CREATE OR REPLACE FUNCTION get_products_filtered(
  p_status       text    DEFAULT NULL,
  p_search       text    DEFAULT NULL,
  p_quality_filter text  DEFAULT NULL,
  p_page         int     DEFAULT 0,
  p_page_size    int     DEFAULT 25
) RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'total', (
      SELECT COUNT(*) FROM products p
      WHERE
        (p_status IS NULL OR p.status = p_status)
        AND (p_search IS NULL OR p_search = '' OR (
              p.name    ILIKE '%' || p_search || '%' OR
              p.brand   ILIKE '%' || p_search || '%' OR
              p.barcode ILIKE '%' || p_search || '%'
            ))
        AND (p_quality_filter IS NULL OR p_quality_filter = '' OR (
              (p_quality_filter = 'missing_name'        AND p.name = '')
           OR (p_quality_filter = 'missing_ingredients' AND p.ingredients_text = '')
           OR (p_quality_filter = 'needs_review'        AND p.name > '' AND p.ingredients_text > '')
           OR (p_quality_filter = 'user_submitted'      AND p.off_id IS NULL)
            ))
    ),
    'products', COALESCE((
      SELECT json_agg(row_to_json(q))
      FROM (
        SELECT
          p.id, p.barcode, p.name, p.brand, p.quantity,
          p.image_front_url, p.ingredients_text,
          p.allergen_tags, p.diet_tags,
          p.status, p.categorization_status,
          p.ai_category_id, p.ai_confidence,
          p.off_id, p.review_reasons, p.has_unknown_ingredients,
          p.created_at, p.updated_at, p.approved_at,
          COALESCE((
            SELECT json_agg(json_build_object('category_id', pc.category_id))
            FROM product_categories pc WHERE pc.product_id = p.id
          ), '[]'::json) AS product_categories
        FROM products p
        WHERE
          (p_status IS NULL OR p.status = p_status)
          AND (p_search IS NULL OR p_search = '' OR (
                p.name    ILIKE '%' || p_search || '%' OR
                p.brand   ILIKE '%' || p_search || '%' OR
                p.barcode ILIKE '%' || p_search || '%'
              ))
          AND (p_quality_filter IS NULL OR p_quality_filter = '' OR (
                (p_quality_filter = 'missing_name'        AND p.name = '')
             OR (p_quality_filter = 'missing_ingredients' AND p.ingredients_text = '')
             OR (p_quality_filter = 'needs_review'        AND p.name > '' AND p.ingredients_text > '')
             OR (p_quality_filter = 'user_submitted'      AND p.off_id IS NULL)
              ))
        ORDER BY p.created_at DESC
        LIMIT p_page_size OFFSET p_page * p_page_size
      ) q
    ), '[]'::json)
  )
$$;

GRANT EXECUTE ON FUNCTION get_products_filtered(text, text, text, int, int) TO anon;
