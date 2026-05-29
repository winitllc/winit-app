/*
  # Fix fn_auto_assign_categories to work correctly as AFTER trigger

  ## Problem
  BEFORE trigger: product row doesn't exist yet when trigger runs,
  so INSERT INTO product_categories fails with FK violation.

  AFTER trigger: product row exists, FK insert works, but RETURN NEW
  is ignored so categorization_status never gets updated.

  ## Fix
  Keep trigger as AFTER. Replace the `NEW.categorization_status :=` 
  assignment (which is silently ignored in AFTER triggers) with an 
  explicit UPDATE statement on the products table.
*/

CREATE OR REPLACE FUNCTION fn_auto_assign_categories()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_tag     text;
  v_cat_id  uuid;
  v_matched int := 0;
BEGIN
  IF NEW.off_categories_tags IS NOT NULL THEN
    FOREACH v_tag IN ARRAY NEW.off_categories_tags LOOP
      SELECT app_category_id INTO v_cat_id
        FROM off_category_mappings WHERE off_tag = v_tag LIMIT 1;
      IF v_cat_id IS NOT NULL THEN
        INSERT INTO product_categories (product_id, category_id)
          VALUES (NEW.id, v_cat_id) ON CONFLICT DO NOTHING;
        v_matched := v_matched + 1;
      END IF;
    END LOOP;
  END IF;

  IF NEW.categorization_status <> 'manual' THEN
    UPDATE products
       SET categorization_status = CASE WHEN v_matched > 0 THEN 'auto_mapped' ELSE 'needs_review' END
     WHERE id = NEW.id
       AND categorization_status <> 'manual';
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_categories ON products;

CREATE TRIGGER trg_auto_assign_categories
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_auto_assign_categories();
