-- Fix trigger: always compute review_reasons; auto-approve only when appropriate
CREATE OR REPLACE FUNCTION fn_update_review_reasons()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  reasons text[];
  is_clean boolean;
BEGIN
  -- Always recompute review_reasons regardless of status
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

  -- Auto-approve only pending products that are not in the AI review queue
  -- and pass all quality checks
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

-- Backfill review_reasons specifically for needs_review products (batched to avoid timeout)
DO $$
DECLARE
  updated int;
  total_updated int := 0;
  batch int := 0;
BEGIN
  LOOP
    UPDATE products SET
      review_reasons = fn_compute_review_reasons(
        name, ingredients_text, off_id, ai_confidence, ai_classification_reason, categorization_status, allergen_tags
      )
    WHERE id IN (
      SELECT id FROM products
      WHERE categorization_status = 'needs_review'
        AND review_reasons = '{}'
      LIMIT 2000
    );
    GET DIAGNOSTICS updated = ROW_COUNT;
    total_updated := total_updated + updated;
    batch := batch + 1;
    EXIT WHEN updated = 0 OR batch >= 10;
  END LOOP;
END;
$$;
