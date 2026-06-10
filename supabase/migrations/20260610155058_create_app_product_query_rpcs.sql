
-- RPC: get products by category slug, paginated, for the mobile app
CREATE OR REPLACE FUNCTION get_products_by_category(
  p_slug      text,
  p_page      int  DEFAULT 0,
  p_page_size int  DEFAULT 24
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'products', COALESCE(
      (SELECT json_agg(row_to_json(p))
       FROM (
         SELECT pav.*
         FROM products_app_visible pav
         INNER JOIN product_categories pc ON pc.product_id = pav.id
         INNER JOIN app_categories     ac ON ac.id = pc.category_id
         WHERE ac.slug = p_slug
         ORDER BY pav.name ASC
         LIMIT  p_page_size
         OFFSET p_page * p_page_size
       ) p),
      '[]'::json
    ),
    'total', (
      SELECT COUNT(DISTINCT pav.id)
      FROM products_app_visible pav
      INNER JOIN product_categories pc ON pc.product_id = pav.id
      INNER JOIN app_categories     ac ON ac.id = pc.category_id
      WHERE ac.slug = p_slug
    ),
    'page',      p_page,
    'pageSize',  p_page_size
  );
$$;

GRANT EXECUTE ON FUNCTION get_products_by_category(text, int, int) TO anon, authenticated;

-- RPC: search products by text query, paginated, for the mobile app
CREATE OR REPLACE FUNCTION search_app_products(
  p_query     text DEFAULT '',
  p_page      int  DEFAULT 0,
  p_page_size int  DEFAULT 24
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'products', COALESCE(
      (SELECT json_agg(row_to_json(p))
       FROM (
         SELECT *
         FROM products_app_visible
         WHERE (
           p_query = '' OR p_query IS NULL
           OR name            ILIKE '%' || p_query || '%'
           OR brand           ILIKE '%' || p_query || '%'
           OR barcode         ILIKE '%' || p_query || '%'
           OR ingredients_text ILIKE '%' || p_query || '%'
           OR generic_name    ILIKE '%' || p_query || '%'
         )
         ORDER BY name ASC
         LIMIT  p_page_size
         OFFSET p_page * p_page_size
       ) p),
      '[]'::json
    ),
    'total', (
      SELECT COUNT(*)
      FROM products_app_visible
      WHERE (
        p_query = '' OR p_query IS NULL
        OR name            ILIKE '%' || p_query || '%'
        OR brand           ILIKE '%' || p_query || '%'
        OR barcode         ILIKE '%' || p_query || '%'
        OR ingredients_text ILIKE '%' || p_query || '%'
        OR generic_name    ILIKE '%' || p_query || '%'
      )
    ),
    'page',      p_page,
    'pageSize',  p_page_size
  );
$$;

GRANT EXECUTE ON FUNCTION search_app_products(text, int, int) TO anon, authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
