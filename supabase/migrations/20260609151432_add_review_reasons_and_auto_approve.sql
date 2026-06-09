-- Add review_reasons column to products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='review_reasons') THEN
    ALTER TABLE products ADD COLUMN review_reasons text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Function: compute review reasons for a product row
CREATE OR REPLACE FUNCTION fn_compute_review_reasons(
  p_name text,
  p_ingredients_text text,
  p_off_id text,
  p_ai_confidence numeric,
  p_ai_classification_reason text,
  p_categorization_status text,
  p_allergen_tags text[]
) RETURNS text[] LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  reasons text[] := '{}';
BEGIN
  IF p_name IS NULL OR trim(p_name) = '' THEN
    reasons := array_append(reasons, 'Missing product name');
  END IF;

  IF p_ingredients_text IS NULL OR trim(p_ingredients_text) = '' THEN
    reasons := array_append(reasons, 'Missing ingredients');
  END IF;

  IF p_off_id IS NULL THEN
    reasons := array_append(reasons, 'User-submitted changes pending approval');
  END IF;

  IF p_ai_confidence IS NOT NULL AND p_ai_confidence < 0.55 THEN
    reasons := array_append(reasons, 'AI confidence below threshold');
  END IF;

  IF p_ai_classification_reason IS NOT NULL AND (
    lower(p_ai_classification_reason) LIKE '%unknown%' OR
    lower(p_ai_classification_reason) LIKE '%unrecognized%' OR
    lower(p_ai_classification_reason) LIKE '%unclear ingredient%' OR
    lower(p_ai_classification_reason) LIKE '%unidentified ingredient%'
  ) THEN
    reasons := array_append(reasons, 'Unknown ingredient detected');
  END IF;

  IF p_ai_classification_reason IS NOT NULL AND (
    lower(p_ai_classification_reason) LIKE '%conflict%' OR
    lower(p_ai_classification_reason) LIKE '%contradict%' OR
    lower(p_ai_classification_reason) LIKE '%inconsistent%'
  ) THEN
    reasons := array_append(reasons, 'Potential ingredient conflict');
  END IF;

  IF p_categorization_status = 'unclassified' AND
     (p_name IS NOT NULL AND trim(p_name) != '') AND
     (p_ingredients_text IS NOT NULL AND trim(p_ingredients_text) != '') THEN
    reasons := array_append(reasons, 'Missing allergen classification');
  END IF;

  RETURN reasons;
END;
$$;

-- Trigger function: recompute review_reasons and auto-approve clean products on INSERT/UPDATE
CREATE OR REPLACE FUNCTION fn_update_review_reasons()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  reasons text[];
  is_clean boolean;
BEGIN
  reasons := fn_compute_review_reasons(
    NEW.name,
    NEW.ingredients_text,
    NEW.off_id,
    NEW.ai_confidence,
    NEW.ai_classification_reason,
    NEW.categorization_status,
    NEW.allergen_tags
  );

  NEW.review_reasons := reasons;

  -- Auto-approve if: has name, has ingredients, not user-submitted, AI confidence OK, no conflicts
  is_clean := (
    NEW.name IS NOT NULL AND trim(NEW.name) != '' AND
    NEW.ingredients_text IS NOT NULL AND trim(NEW.ingredients_text) != '' AND
    NEW.off_id IS NOT NULL AND
    (NEW.ai_confidence IS NULL OR NEW.ai_confidence >= 0.55) AND
    (NEW.ai_classification_reason IS NULL OR (
      lower(NEW.ai_classification_reason) NOT LIKE '%unknown%' AND
      lower(NEW.ai_classification_reason) NOT LIKE '%conflict%' AND
      lower(NEW.ai_classification_reason) NOT LIKE '%contradict%'
    ))
  );

  IF is_clean AND NEW.status = 'pending' AND NEW.categorization_status != 'needs_review' THEN
    NEW.status := 'approved';
    NEW.approved_at := now();
    NEW.approved_by := 'system';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_reasons ON products;
CREATE TRIGGER trg_review_reasons
BEFORE INSERT OR UPDATE OF name, ingredients_text, off_id, ai_confidence, ai_classification_reason, categorization_status, allergen_tags
ON products
FOR EACH ROW EXECUTE FUNCTION fn_update_review_reasons();

-- RPC for the admin to trigger backfill on demand (runs in batches to avoid timeout)
CREATE OR REPLACE FUNCTION backfill_review_reasons(batch_size int DEFAULT 500)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated int;
BEGIN
  UPDATE products SET
    review_reasons = fn_compute_review_reasons(
      name, ingredients_text, off_id, ai_confidence, ai_classification_reason, categorization_status, allergen_tags
    )
  WHERE id IN (
    SELECT id FROM products
    WHERE (status = 'pending' OR categorization_status = 'needs_review')
      AND review_reasons = '{}'
    LIMIT batch_size
  );
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated;
END;
$$;

GRANT EXECUTE ON FUNCTION backfill_review_reasons(int) TO anon;
