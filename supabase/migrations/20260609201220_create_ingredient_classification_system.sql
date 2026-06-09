
-- ── ingredient_classifications ───────────────────────────────────────────────
CREATE TABLE ingredient_classifications (
  name        TEXT        PRIMARY KEY,   -- lowercase normalized
  allergen_tags TEXT[]    NOT NULL DEFAULT '{}',
  notes       TEXT        NOT NULL DEFAULT '',
  classified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  classified_by TEXT      NOT NULL DEFAULT 'admin'
);

ALTER TABLE ingredient_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_ic" ON ingredient_classifications FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_ic" ON ingredient_classifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_ic" ON ingredient_classifications FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_ic" ON ingredient_classifications FOR DELETE TO anon USING (true);

-- ── product_unknown_ingredients (pre-computed cache) ─────────────────────────
CREATE TABLE product_unknown_ingredients (
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  PRIMARY KEY (product_id, ingredient_name)
);
CREATE INDEX idx_pui_ingredient_name ON product_unknown_ingredients(ingredient_name);

ALTER TABLE product_unknown_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_pui" ON product_unknown_ingredients FOR SELECT TO anon USING (true);

-- ── Trigger: keep product_unknown_ingredients in sync on product changes ──────
CREATE OR REPLACE FUNCTION fn_sync_product_unknown_ingredients()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_unknowns TEXT[];
BEGIN
  DELETE FROM product_unknown_ingredients WHERE product_id = NEW.id;

  IF NEW.status = 'pending' AND trim(COALESCE(NEW.ingredients_text, '')) != '' THEN
    v_unknowns := fn_find_unknown_ingredients(NEW.ingredients_text);
    IF array_length(v_unknowns, 1) IS NOT NULL THEN
      INSERT INTO product_unknown_ingredients (product_id, ingredient_name)
      SELECT NEW.id, lower(u)
      FROM unnest(v_unknowns) u
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_product_unknown_ingredients
AFTER INSERT OR UPDATE OF ingredients_text, status
ON products FOR EACH ROW
EXECUTE FUNCTION fn_sync_product_unknown_ingredients();

-- ── Backfill from existing data ───────────────────────────────────────────────
INSERT INTO product_unknown_ingredients (product_id, ingredient_name)
SELECT p.id, lower(u)
FROM   products p,
       unnest(fn_find_unknown_ingredients(p.ingredients_text)) u
WHERE  p.has_unknown_ingredients = true
  AND  p.status = 'pending'
  AND  trim(p.ingredients_text) != ''
ON CONFLICT DO NOTHING;

-- ── get_unknown_ingredients RPC ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_unknown_ingredients(
  p_search    TEXT DEFAULT NULL,
  p_page      INT  DEFAULT 0,
  p_page_size INT  DEFAULT 50
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total BIGINT;
  v_items JSON;
BEGIN
  SELECT COUNT(DISTINCT ingredient_name) INTO v_total
  FROM   product_unknown_ingredients
  WHERE  (p_search IS NULL OR ingredient_name ILIKE '%' || lower(p_search) || '%');

  SELECT COALESCE(json_agg(t ORDER BY t.product_count DESC, t.name), '[]'::json)
  INTO   v_items
  FROM (
    SELECT
      pui.ingredient_name                                    AS name,
      COUNT(DISTINCT pui.product_id)::int                    AS product_count,
      (ic.name IS NOT NULL)                                  AS is_classified,
      COALESCE(ic.allergen_tags, '{}'::text[])               AS allergen_tags,
      COALESCE(ic.notes, '')                                 AS notes
    FROM   product_unknown_ingredients pui
    LEFT JOIN ingredient_classifications ic ON ic.name = pui.ingredient_name
    WHERE  (p_search IS NULL OR pui.ingredient_name ILIKE '%' || lower(p_search) || '%')
    GROUP BY pui.ingredient_name, ic.name, ic.allergen_tags, ic.notes
    ORDER BY COUNT(DISTINCT pui.product_id) DESC, pui.ingredient_name
    LIMIT  p_page_size
    OFFSET (p_page * p_page_size)
  ) t;

  RETURN json_build_object('total', v_total, 'items', v_items);
END;
$$;

-- ── classify_ingredient RPC ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION classify_ingredient(
  p_name         TEXT,
  p_allergen_tags TEXT[] DEFAULT '{}',
  p_notes        TEXT   DEFAULT ''
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_normalized    TEXT;
  v_affected_ids  UUID[];
  v_affected_count INT := 0;
  v_auto_approved  INT := 0;
BEGIN
  v_normalized := lower(trim(p_name));

  -- 1. Mark as known so future scans skip it
  INSERT INTO known_ingredients (name) VALUES (v_normalized) ON CONFLICT DO NOTHING;

  -- 2. Upsert classification record
  INSERT INTO ingredient_classifications (name, allergen_tags, notes)
  VALUES (v_normalized, COALESCE(p_allergen_tags, '{}'), COALESCE(p_notes, ''))
  ON CONFLICT (name) DO UPDATE SET
    allergen_tags = COALESCE(p_allergen_tags, '{}'),
    notes         = COALESCE(p_notes, ''),
    classified_at = now();

  -- 3. Collect affected product IDs
  SELECT array_agg(DISTINCT product_id) INTO v_affected_ids
  FROM   product_unknown_ingredients
  WHERE  ingredient_name = v_normalized;

  IF v_affected_ids IS NULL OR array_length(v_affected_ids, 1) = 0 THEN
    RETURN json_build_object('affected_products', 0, 'auto_approved', 0);
  END IF;

  v_affected_count := array_length(v_affected_ids, 1);

  -- 4. Remove this ingredient from the cache for all affected products
  DELETE FROM product_unknown_ingredients WHERE ingredient_name = v_normalized;

  -- 5a. Auto-approve products that now have NO remaining unknowns
  --     (have name, have ingredients, and are still pending)
  UPDATE products SET
    has_unknown_ingredients = false,
    status      = 'approved',
    approved_at = now(),
    approved_by = 'system',
    allergen_tags = CASE
      WHEN array_length(p_allergen_tags, 1) > 0
      THEN array(SELECT DISTINCT unnest(array_cat(allergen_tags, p_allergen_tags)))
      ELSE allergen_tags
    END,
    updated_at  = now()
  WHERE id = ANY(v_affected_ids)
    AND status  = 'pending'
    AND trim(COALESCE(name, ''))             != ''
    AND trim(COALESCE(ingredients_text, '')) != ''
    AND NOT EXISTS (
      SELECT 1 FROM product_unknown_ingredients pui
      WHERE pui.product_id = products.id
    );

  GET DIAGNOSTICS v_auto_approved = ROW_COUNT;

  -- 5b. For products that still have unknowns: just merge allergen tags
  IF array_length(p_allergen_tags, 1) > 0 THEN
    UPDATE products SET
      allergen_tags = array(SELECT DISTINCT unnest(array_cat(allergen_tags, p_allergen_tags))),
      updated_at    = now()
    WHERE id = ANY(v_affected_ids)
      AND status = 'pending'
      AND EXISTS (
        SELECT 1 FROM product_unknown_ingredients pui
        WHERE pui.product_id = products.id
      );
  END IF;

  RETURN json_build_object(
    'affected_products', v_affected_count,
    'auto_approved',     v_auto_approved
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
