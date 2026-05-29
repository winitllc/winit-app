/*
  # WINIT Product Taxonomy

  ## Overview
  Replaces the flat `app_categories` system with a two-level hierarchy:
  parent categories → subcategories, plus keyword-based auto-mapping rules
  that fire on product import.

  ## New Tables

  ### `taxonomy_parents`
  The 15–20 broad parent categories (Snacks, Beverages, Dairy, etc.).
  - `id` (uuid, pk)
  - `slug` (text, unique) — URL-safe
  - `display_name` (text)
  - `image_url` (text)
  - `sort_order` (int)
  - `icon` (text) — emoji used in the UI
  - `description` (text)

  ### `taxonomy_subcategories`
  Subcategories nested under a parent (Chips, Crackers, Popcorn under Snacks).
  - `id` (uuid, pk)
  - `parent_id` (uuid → taxonomy_parents)
  - `slug` (text, unique)
  - `display_name` (text)
  - `sort_order` (int)
  - `off_tags` (text[]) — OFF category tags that map to this subcategory

  ### `taxonomy_off_mappings`
  Keyword/tag rules that map an OFF `off_categories_tags` value to a
  (parent, subcategory) pair. Evaluated in priority order on import.
  - `id` (uuid, pk)
  - `off_pattern` (text) — exact OFF tag or prefix to match (e.g. "en:chips")
  - `match_type` (text) — 'exact' | 'prefix' | 'contains'
  - `parent_id` (uuid → taxonomy_parents)
  - `subcategory_id` (uuid → taxonomy_subcategories, nullable)
  - `priority` (int) — higher = evaluated first

  ### `product_taxonomy`
  Resolved many-to-many: products ↔ (parent, subcategory).
  One row per (product, parent) assignment. subcategory_id is nullable
  (product may be assigned to parent only, pending subcat review).
  - `product_id` (uuid → products)
  - `parent_id` (uuid → taxonomy_parents)
  - `subcategory_id` (uuid → taxonomy_subcategories, nullable)
  - `auto_assigned` (bool) — true if set by import rule, false if admin override
  - `assigned_at` (timestamptz)

  ## Functions

  ### `fn_assign_product_taxonomy(p_product_id uuid)`
  Reads a product's `off_categories_tags`, runs them against
  `taxonomy_off_mappings` in priority order, inserts matching rows into
  `product_taxonomy`. Safe to re-run (upsert logic). Returns count of matches.

  ### `fn_bulk_reclassify_products()`
  Runs `fn_assign_product_taxonomy` for every product. Used after adding
  new mapping rules. Returns number of products updated.

  ## Security
  - All tables: RLS enabled
  - SELECT: anon + authenticated
  - INSERT/UPDATE/DELETE: anon (admin panel uses anon key with no auth)
*/

-- ── Parent categories ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS taxonomy_parents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  display_name text NOT NULL,
  image_url    text NOT NULL DEFAULT '',
  icon         text NOT NULL DEFAULT '',
  description  text NOT NULL DEFAULT '',
  sort_order   int  NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE taxonomy_parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read taxonomy parents"
  ON taxonomy_parents FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon can insert taxonomy parents"
  ON taxonomy_parents FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update taxonomy parents"
  ON taxonomy_parents FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete taxonomy parents"
  ON taxonomy_parents FOR DELETE TO anon USING (true);

-- ── Subcategories ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS taxonomy_subcategories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid NOT NULL REFERENCES taxonomy_parents(id) ON DELETE CASCADE,
  slug         text UNIQUE NOT NULL,
  display_name text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0,
  off_tags     text[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS taxonomy_subcategories_parent_idx ON taxonomy_subcategories(parent_id);

ALTER TABLE taxonomy_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read taxonomy subcategories"
  ON taxonomy_subcategories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon can insert taxonomy subcategories"
  ON taxonomy_subcategories FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update taxonomy subcategories"
  ON taxonomy_subcategories FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete taxonomy subcategories"
  ON taxonomy_subcategories FOR DELETE TO anon USING (true);

-- ── OFF mapping rules ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS taxonomy_off_mappings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  off_pattern      text NOT NULL,
  match_type       text NOT NULL DEFAULT 'exact' CHECK (match_type IN ('exact','prefix','contains')),
  parent_id        uuid NOT NULL REFERENCES taxonomy_parents(id) ON DELETE CASCADE,
  subcategory_id   uuid REFERENCES taxonomy_subcategories(id) ON DELETE SET NULL,
  priority         int  NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS taxonomy_off_mappings_pattern_idx ON taxonomy_off_mappings(off_pattern);
CREATE INDEX IF NOT EXISTS taxonomy_off_mappings_parent_idx  ON taxonomy_off_mappings(parent_id);

ALTER TABLE taxonomy_off_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read taxonomy mappings"
  ON taxonomy_off_mappings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon can insert taxonomy mappings"
  ON taxonomy_off_mappings FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update taxonomy mappings"
  ON taxonomy_off_mappings FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete taxonomy mappings"
  ON taxonomy_off_mappings FOR DELETE TO anon USING (true);

-- ── Product → taxonomy assignments ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_taxonomy (
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  parent_id       uuid NOT NULL REFERENCES taxonomy_parents(id) ON DELETE CASCADE,
  subcategory_id  uuid REFERENCES taxonomy_subcategories(id) ON DELETE SET NULL,
  auto_assigned   bool NOT NULL DEFAULT true,
  assigned_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, parent_id)
);

CREATE INDEX IF NOT EXISTS product_taxonomy_product_idx     ON product_taxonomy(product_id);
CREATE INDEX IF NOT EXISTS product_taxonomy_parent_idx      ON product_taxonomy(parent_id);
CREATE INDEX IF NOT EXISTS product_taxonomy_subcategory_idx ON product_taxonomy(subcategory_id);

ALTER TABLE product_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product taxonomy"
  ON product_taxonomy FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon can insert product taxonomy"
  ON product_taxonomy FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update product taxonomy"
  ON product_taxonomy FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete product taxonomy"
  ON product_taxonomy FOR DELETE TO anon USING (true);

-- ── Auto-assign function ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_assign_product_taxonomy(p_product_id uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  v_tags    text[];
  v_tag     text;
  v_row     taxonomy_off_mappings%ROWTYPE;
  v_matched bool;
  v_count   int := 0;
  v_seen    uuid[] := '{}';
BEGIN
  -- Get the product's OFF category tags
  SELECT off_categories_tags INTO v_tags
  FROM products WHERE id = p_product_id;

  IF v_tags IS NULL OR array_length(v_tags, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- For each tag, find the highest-priority mapping
  FOREACH v_tag IN ARRAY v_tags LOOP
    SELECT * INTO v_row
    FROM taxonomy_off_mappings
    WHERE (
      (match_type = 'exact'    AND off_pattern = v_tag) OR
      (match_type = 'prefix'   AND v_tag LIKE off_pattern || '%') OR
      (match_type = 'contains' AND v_tag ILIKE '%' || off_pattern || '%')
    )
    ORDER BY priority DESC
    LIMIT 1;

    IF FOUND AND NOT (v_row.parent_id = ANY(v_seen)) THEN
      INSERT INTO product_taxonomy (product_id, parent_id, subcategory_id, auto_assigned)
      VALUES (p_product_id, v_row.parent_id, v_row.subcategory_id, true)
      ON CONFLICT (product_id, parent_id) DO UPDATE
        SET subcategory_id = EXCLUDED.subcategory_id,
            auto_assigned  = true,
            assigned_at    = now()
      WHERE product_taxonomy.auto_assigned = true;

      v_seen  := array_append(v_seen, v_row.parent_id);
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── Bulk reclassify RPC ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_bulk_reclassify_products()
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  v_id      uuid;
  v_updated int := 0;
BEGIN
  FOR v_id IN SELECT id FROM products LOOP
    PERFORM fn_assign_product_taxonomy(v_id);
    v_updated := v_updated + 1;
  END LOOP;
  RETURN v_updated;
END;
$$;
