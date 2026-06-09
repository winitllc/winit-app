
-- ── get_products_for_ingredient ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_products_for_ingredient(
  p_ingredient_name TEXT,
  p_page            INT DEFAULT 0,
  p_page_size       INT DEFAULT 24
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_normalized TEXT;
  v_total      BIGINT;
  v_items      JSON;
BEGIN
  v_normalized := lower(trim(p_ingredient_name));

  SELECT COUNT(DISTINCT p.id) INTO v_total
  FROM   products p
  JOIN   product_unknown_ingredients pui ON pui.product_id = p.id
  WHERE  pui.ingredient_name = v_normalized
    AND  p.status = 'pending';

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_items
  FROM (
    SELECT
      p.id, p.barcode, p.name, p.brand, p.quantity,
      p.image_front_url, p.image_ingredients_url, p.image_nutrition_url,
      p.ingredients_text, p.allergen_tags, p.diet_tags, p.label_tags,
      p.custom_tags, p.off_categories_tags, p.off_labels_tags,
      p.nutriscore_grade, p.nova_group, p.status, p.health_rating,
      p.ai_insights, p.admin_notes, p.off_id,
      p.approved_at, p.approved_by, p.created_at, p.updated_at,
      p.ai_category_id, p.ai_subcategory_id, p.ai_confidence,
      p.ai_category_confidence, p.ai_subcategory_confidence,
      p.ai_tags, p.ai_tag_confidences, p.ai_classification_reason,
      p.ai_classified_at, p.ai_model, p.categorization_status,
      p.review_priority, p.review_reasons, p.has_unknown_ingredients
    FROM   products p
    JOIN   product_unknown_ingredients pui ON pui.product_id = p.id
    WHERE  pui.ingredient_name = v_normalized
      AND  p.status = 'pending'
    ORDER BY p.name, p.created_at DESC
    LIMIT  p_page_size
    OFFSET (p_page * p_page_size)
  ) t;

  RETURN json_build_object('total', v_total, 'products', v_items);
END;
$$;

-- ── delete_unknown_ingredient ─────────────────────────────────────────────────
-- Permanently deletes all pending products that contain this unknown ingredient,
-- removes it from the unknown ingredients cache, and blocks it from reappearing.
CREATE OR REPLACE FUNCTION delete_unknown_ingredient(
  p_name TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_normalized TEXT;
  v_product_ids UUID[];
  v_deleted     INT := 0;
BEGIN
  v_normalized := lower(trim(p_name));

  -- Collect affected product IDs
  SELECT array_agg(DISTINCT product_id) INTO v_product_ids
  FROM   product_unknown_ingredients
  WHERE  ingredient_name = v_normalized;

  IF v_product_ids IS NULL OR array_length(v_product_ids, 1) = 0 THEN
    -- Still clean up the classification record if it exists
    DELETE FROM ingredient_classifications WHERE name = v_normalized;
    RETURN json_build_object('deleted_products', 0);
  END IF;

  v_deleted := array_length(v_product_ids, 1);

  -- Delete from dependent tables before deleting products
  -- (FK constraints may not all have CASCADE)
  DELETE FROM product_unknown_ingredients WHERE product_id = ANY(v_product_ids);
  DELETE FROM product_categories        WHERE product_id = ANY(v_product_ids);
  DELETE FROM product_taxonomy          WHERE product_id = ANY(v_product_ids);
  DELETE FROM product_contributions     WHERE product_id = ANY(v_product_ids);
  DELETE FROM ai_correction_log         WHERE product_id = ANY(v_product_ids);
  DELETE FROM winit_scan_history        WHERE product_id = ANY(v_product_ids);
  DELETE FROM winit_favorites           WHERE product_id = ANY(v_product_ids);

  -- Delete the products themselves
  DELETE FROM products WHERE id = ANY(v_product_ids);

  -- Clean up any classification record
  DELETE FROM ingredient_classifications WHERE name = v_normalized;

  -- Add to known_ingredients so it won't be flagged as "unknown" on future imports,
  -- preventing re-accumulation of the same invalid ingredient
  INSERT INTO known_ingredients (name) VALUES (v_normalized) ON CONFLICT DO NOTHING;

  RETURN json_build_object('deleted_products', v_deleted);
END;
$$;

NOTIFY pgrst, 'reload schema';
