/*
  # Fix auto-assign categories trigger timing

  ## Problem
  The trigger was changed to AFTER INSERT/UPDATE to avoid FK violations,
  but AFTER triggers cannot modify NEW.categorization_status via RETURN NEW.
  Result: categorization_status never gets set to 'auto_mapped'.

  The original FK violation was caused by old edge function code that manually
  inserted into product_categories BEFORE the product row was committed. That
  code has been removed. It is now safe to use BEFORE again.

  ## Changes
  - Convert trg_auto_assign_categories back to BEFORE INSERT OR UPDATE
  - The function already returns NEW correctly for BEFORE triggers
*/

DROP TRIGGER IF EXISTS trg_auto_assign_categories ON products;

CREATE TRIGGER trg_auto_assign_categories
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_auto_assign_categories();
