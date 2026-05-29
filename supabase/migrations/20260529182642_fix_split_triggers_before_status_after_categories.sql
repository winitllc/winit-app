/*
  # Fix fn_auto_assign_categories infinite recursion

  ## Problem
  The AFTER trigger does UPDATE products SET categorization_status = ...
  which fires the trigger again, causing infinite recursion.

  ## Fix
  Split into two triggers:
  1. AFTER INSERT OR UPDATE OF off_categories_tags — handles product_categories inserts
     and sets categorization_status via a separate UPDATE only when off_categories_tags changed
  2. Guard the UPDATE with a condition so it only fires when categorization_status
     actually needs changing, using UPDATE OF off_categories_tags to avoid re-triggering.

  Simpler approach: use a single BEFORE trigger only for categorization_status (safe,
  no FK insert needed in BEFORE), and a separate AFTER trigger only for product_categories.
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_auto_assign_categories ON products;

-- Trigger 1 (BEFORE): sets categorization_status only - no FK issues here
CREATE OR REPLACE FUNCTION fn_set_categorization_status()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_tag    text;
  v_cat_id uuid;
  v_matched int := 0;
BEGIN
  IF NEW.off_categories_tags IS NOT NULL THEN
    FOREACH v_tag IN ARRAY NEW.off_categories_tags LOOP
      SELECT app_category_id INTO v_cat_id
        FROM off_category_mappings WHERE off_tag = v_tag LIMIT 1;
      IF v_cat_id IS NOT NULL THEN
        v_matched := v_matched + 1;
      END IF;
    END LOOP;
  END IF;

  IF NEW.categorization_status <> 'manual' THEN
    NEW.categorization_status := CASE WHEN v_matched > 0 THEN 'auto_mapped' ELSE 'needs_review' END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_categorization_status ON products;
CREATE TRIGGER trg_set_categorization_status
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_set_categorization_status();

-- Trigger 2 (AFTER): inserts into product_categories - FK safe because row exists
CREATE OR REPLACE FUNCTION fn_assign_product_categories()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_tag    text;
  v_cat_id uuid;
BEGIN
  IF NEW.off_categories_tags IS NOT NULL THEN
    FOREACH v_tag IN ARRAY NEW.off_categories_tags LOOP
      SELECT app_category_id INTO v_cat_id
        FROM off_category_mappings WHERE off_tag = v_tag LIMIT 1;
      IF v_cat_id IS NOT NULL THEN
        INSERT INTO product_categories (product_id, category_id)
          VALUES (NEW.id, v_cat_id) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_product_categories ON products;
CREATE TRIGGER trg_assign_product_categories
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_assign_product_categories();
