-- Re-create the trigger function as SECURITY DEFINER so it bypasses RLS
-- when updating product_stats (the calling role is anon, which has no write policy).
CREATE OR REPLACE FUNCTION fn_update_product_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO product_stats (id, pending_count, approved_count, rejected_count, total_count, updated_at)
  VALUES (1, 0, 0, 0, 0, now())
  ON CONFLICT (id) DO NOTHING;

  IF TG_OP = 'INSERT' THEN
    UPDATE product_stats SET
      pending_count  = pending_count  + (CASE WHEN NEW.status = 'pending'  THEN 1 ELSE 0 END),
      approved_count = approved_count + (CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END),
      rejected_count = rejected_count + (CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END),
      total_count    = total_count    + 1,
      updated_at     = now()
    WHERE id = 1;

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE product_stats SET
      pending_count  = pending_count  + (CASE WHEN NEW.status = 'pending'  THEN 1 ELSE 0 END) - (CASE WHEN OLD.status = 'pending'  THEN 1 ELSE 0 END),
      approved_count = approved_count + (CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END) - (CASE WHEN OLD.status = 'approved' THEN 1 ELSE 0 END),
      rejected_count = rejected_count + (CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END) - (CASE WHEN OLD.status = 'rejected' THEN 1 ELSE 0 END),
      updated_at     = now()
    WHERE id = 1;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_stats SET
      pending_count  = pending_count  - (CASE WHEN OLD.status = 'pending'  THEN 1 ELSE 0 END),
      approved_count = approved_count - (CASE WHEN OLD.status = 'approved' THEN 1 ELSE 0 END),
      rejected_count = rejected_count - (CASE WHEN OLD.status = 'rejected' THEN 1 ELSE 0 END),
      total_count    = total_count    - 1,
      updated_at     = now()
    WHERE id = 1;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
