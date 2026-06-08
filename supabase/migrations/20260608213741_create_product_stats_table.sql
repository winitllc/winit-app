-- Materialized product stats table for instant dashboard counts
CREATE TABLE IF NOT EXISTS product_stats (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pending_count bigint NOT NULL DEFAULT 0,
  approved_count bigint NOT NULL DEFAULT 0,
  rejected_count bigint NOT NULL DEFAULT 0,
  total_count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_product_stats" ON product_stats FOR SELECT TO anon USING (true);

-- Seed with current counts
INSERT INTO product_stats (id, pending_count, approved_count, rejected_count, total_count, updated_at)
SELECT
  1,
  COUNT(*) FILTER (WHERE status = 'pending'),
  COUNT(*) FILTER (WHERE status = 'approved'),
  COUNT(*) FILTER (WHERE status = 'rejected'),
  COUNT(*),
  now()
FROM products
ON CONFLICT (id) DO UPDATE SET
  pending_count  = EXCLUDED.pending_count,
  approved_count = EXCLUDED.approved_count,
  rejected_count = EXCLUDED.rejected_count,
  total_count    = EXCLUDED.total_count,
  updated_at     = EXCLUDED.updated_at;

-- Trigger function to keep counts in sync
CREATE OR REPLACE FUNCTION fn_update_product_stats()
RETURNS trigger LANGUAGE plpgsql AS $$
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

DROP TRIGGER IF EXISTS trg_product_stats ON products;
CREATE TRIGGER trg_product_stats
AFTER INSERT OR UPDATE OF status OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION fn_update_product_stats();
