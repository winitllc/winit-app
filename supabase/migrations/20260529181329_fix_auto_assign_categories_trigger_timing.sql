/*
  # Fix trg_auto_assign_categories trigger timing

  The trigger was BEFORE INSERT/UPDATE, causing FK violations when it tried to
  insert into product_categories using NEW.id — the product row doesn't exist
  in the table yet during a BEFORE trigger.

  Change to AFTER INSERT/UPDATE so the product row is committed before the
  category assignment runs.
*/

DROP TRIGGER IF EXISTS trg_auto_assign_categories ON products;

CREATE TRIGGER trg_auto_assign_categories
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_auto_assign_categories();
