-- Step 1: Add quality filter count columns (no backfill yet)
ALTER TABLE product_stats
  ADD COLUMN IF NOT EXISTS qf_missing_name_all              bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_missing_name_pending          bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_missing_name_approved         bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_missing_name_rejected         bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_missing_ingredients_all       bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_missing_ingredients_pending   bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_missing_ingredients_approved  bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_missing_ingredients_rejected  bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_needs_review_all              bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_needs_review_pending          bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_needs_review_approved         bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_needs_review_rejected         bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_user_submitted_all            bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_user_submitted_pending        bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_user_submitted_approved       bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qf_user_submitted_rejected       bigint NOT NULL DEFAULT 0;

-- Step 2: Rewrite trigger to maintain the new columns
CREATE OR REPLACE FUNCTION fn_update_product_stats()
RETURNS TRIGGER SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
  v_old_nr bool; v_old_mn bool; v_old_mi bool; v_old_us bool;
  v_new_nr bool; v_new_mn bool; v_new_mi bool; v_new_us bool;
BEGIN
  INSERT INTO product_stats (id, pending_count, approved_count, rejected_count, total_count, updated_at)
  VALUES (1, 0, 0, 0, 0, now())
  ON CONFLICT (id) DO NOTHING;

  IF TG_OP = 'INSERT' THEN
    v_new_nr := (NEW.name > '' AND NEW.ingredients_text > '');
    v_new_mn := (NEW.name IS NULL OR NEW.name = '');
    v_new_mi := (NEW.ingredients_text IS NULL OR NEW.ingredients_text = '');
    v_new_us := (NEW.off_id IS NULL);
    UPDATE product_stats SET
      pending_count               = pending_count               + (CASE WHEN NEW.status='pending'  THEN 1 ELSE 0 END),
      approved_count              = approved_count              + (CASE WHEN NEW.status='approved' THEN 1 ELSE 0 END),
      rejected_count              = rejected_count              + (CASE WHEN NEW.status='rejected' THEN 1 ELSE 0 END),
      total_count                 = total_count                 + 1,
      qf_needs_review_all         = qf_needs_review_all         + (CASE WHEN v_new_nr THEN 1 ELSE 0 END),
      qf_needs_review_pending     = qf_needs_review_pending     + (CASE WHEN NEW.status='pending'  AND v_new_nr THEN 1 ELSE 0 END),
      qf_needs_review_approved    = qf_needs_review_approved    + (CASE WHEN NEW.status='approved' AND v_new_nr THEN 1 ELSE 0 END),
      qf_needs_review_rejected    = qf_needs_review_rejected    + (CASE WHEN NEW.status='rejected' AND v_new_nr THEN 1 ELSE 0 END),
      qf_missing_name_all         = qf_missing_name_all         + (CASE WHEN v_new_mn THEN 1 ELSE 0 END),
      qf_missing_name_pending     = qf_missing_name_pending     + (CASE WHEN NEW.status='pending'  AND v_new_mn THEN 1 ELSE 0 END),
      qf_missing_name_approved    = qf_missing_name_approved    + (CASE WHEN NEW.status='approved' AND v_new_mn THEN 1 ELSE 0 END),
      qf_missing_name_rejected    = qf_missing_name_rejected    + (CASE WHEN NEW.status='rejected' AND v_new_mn THEN 1 ELSE 0 END),
      qf_missing_ingredients_all      = qf_missing_ingredients_all      + (CASE WHEN v_new_mi THEN 1 ELSE 0 END),
      qf_missing_ingredients_pending  = qf_missing_ingredients_pending  + (CASE WHEN NEW.status='pending'  AND v_new_mi THEN 1 ELSE 0 END),
      qf_missing_ingredients_approved = qf_missing_ingredients_approved + (CASE WHEN NEW.status='approved' AND v_new_mi THEN 1 ELSE 0 END),
      qf_missing_ingredients_rejected = qf_missing_ingredients_rejected + (CASE WHEN NEW.status='rejected' AND v_new_mi THEN 1 ELSE 0 END),
      qf_user_submitted_all       = qf_user_submitted_all       + (CASE WHEN v_new_us THEN 1 ELSE 0 END),
      qf_user_submitted_pending   = qf_user_submitted_pending   + (CASE WHEN NEW.status='pending'  AND v_new_us THEN 1 ELSE 0 END),
      qf_user_submitted_approved  = qf_user_submitted_approved  + (CASE WHEN NEW.status='approved' AND v_new_us THEN 1 ELSE 0 END),
      qf_user_submitted_rejected  = qf_user_submitted_rejected  + (CASE WHEN NEW.status='rejected' AND v_new_us THEN 1 ELSE 0 END),
      updated_at = now()
    WHERE id = 1;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_nr := (OLD.name > '' AND OLD.ingredients_text > '');
    v_old_mn := (OLD.name IS NULL OR OLD.name = '');
    v_old_mi := (OLD.ingredients_text IS NULL OR OLD.ingredients_text = '');
    v_old_us := (OLD.off_id IS NULL);
    UPDATE product_stats SET
      pending_count               = pending_count               - (CASE WHEN OLD.status='pending'  THEN 1 ELSE 0 END),
      approved_count              = approved_count              - (CASE WHEN OLD.status='approved' THEN 1 ELSE 0 END),
      rejected_count              = rejected_count              - (CASE WHEN OLD.status='rejected' THEN 1 ELSE 0 END),
      total_count                 = total_count                 - 1,
      qf_needs_review_all         = qf_needs_review_all         - (CASE WHEN v_old_nr THEN 1 ELSE 0 END),
      qf_needs_review_pending     = qf_needs_review_pending     - (CASE WHEN OLD.status='pending'  AND v_old_nr THEN 1 ELSE 0 END),
      qf_needs_review_approved    = qf_needs_review_approved    - (CASE WHEN OLD.status='approved' AND v_old_nr THEN 1 ELSE 0 END),
      qf_needs_review_rejected    = qf_needs_review_rejected    - (CASE WHEN OLD.status='rejected' AND v_old_nr THEN 1 ELSE 0 END),
      qf_missing_name_all         = qf_missing_name_all         - (CASE WHEN v_old_mn THEN 1 ELSE 0 END),
      qf_missing_name_pending     = qf_missing_name_pending     - (CASE WHEN OLD.status='pending'  AND v_old_mn THEN 1 ELSE 0 END),
      qf_missing_name_approved    = qf_missing_name_approved    - (CASE WHEN OLD.status='approved' AND v_old_mn THEN 1 ELSE 0 END),
      qf_missing_name_rejected    = qf_missing_name_rejected    - (CASE WHEN OLD.status='rejected' AND v_old_mn THEN 1 ELSE 0 END),
      qf_missing_ingredients_all      = qf_missing_ingredients_all      - (CASE WHEN v_old_mi THEN 1 ELSE 0 END),
      qf_missing_ingredients_pending  = qf_missing_ingredients_pending  - (CASE WHEN OLD.status='pending'  AND v_old_mi THEN 1 ELSE 0 END),
      qf_missing_ingredients_approved = qf_missing_ingredients_approved - (CASE WHEN OLD.status='approved' AND v_old_mi THEN 1 ELSE 0 END),
      qf_missing_ingredients_rejected = qf_missing_ingredients_rejected - (CASE WHEN OLD.status='rejected' AND v_old_mi THEN 1 ELSE 0 END),
      qf_user_submitted_all       = qf_user_submitted_all       - (CASE WHEN v_old_us THEN 1 ELSE 0 END),
      qf_user_submitted_pending   = qf_user_submitted_pending   - (CASE WHEN OLD.status='pending'  AND v_old_us THEN 1 ELSE 0 END),
      qf_user_submitted_approved  = qf_user_submitted_approved  - (CASE WHEN OLD.status='approved' AND v_old_us THEN 1 ELSE 0 END),
      qf_user_submitted_rejected  = qf_user_submitted_rejected  - (CASE WHEN OLD.status='rejected' AND v_old_us THEN 1 ELSE 0 END),
      updated_at = now()
    WHERE id = 1;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status
       OR OLD.name IS DISTINCT FROM NEW.name
       OR OLD.ingredients_text IS DISTINCT FROM NEW.ingredients_text
       OR OLD.off_id IS DISTINCT FROM NEW.off_id THEN
      v_old_nr := (OLD.name > '' AND OLD.ingredients_text > '');
      v_old_mn := (OLD.name IS NULL OR OLD.name = '');
      v_old_mi := (OLD.ingredients_text IS NULL OR OLD.ingredients_text = '');
      v_old_us := (OLD.off_id IS NULL);
      v_new_nr := (NEW.name > '' AND NEW.ingredients_text > '');
      v_new_mn := (NEW.name IS NULL OR NEW.name = '');
      v_new_mi := (NEW.ingredients_text IS NULL OR NEW.ingredients_text = '');
      v_new_us := (NEW.off_id IS NULL);
      UPDATE product_stats SET
        pending_count               = pending_count               + (CASE WHEN NEW.status='pending'  THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='pending'  THEN 1 ELSE 0 END),
        approved_count              = approved_count              + (CASE WHEN NEW.status='approved' THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='approved' THEN 1 ELSE 0 END),
        rejected_count              = rejected_count              + (CASE WHEN NEW.status='rejected' THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='rejected' THEN 1 ELSE 0 END),
        qf_needs_review_all         = qf_needs_review_all         + (CASE WHEN v_new_nr THEN 1 ELSE 0 END) - (CASE WHEN v_old_nr THEN 1 ELSE 0 END),
        qf_needs_review_pending     = qf_needs_review_pending     + (CASE WHEN NEW.status='pending'  AND v_new_nr THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='pending'  AND v_old_nr THEN 1 ELSE 0 END),
        qf_needs_review_approved    = qf_needs_review_approved    + (CASE WHEN NEW.status='approved' AND v_new_nr THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='approved' AND v_old_nr THEN 1 ELSE 0 END),
        qf_needs_review_rejected    = qf_needs_review_rejected    + (CASE WHEN NEW.status='rejected' AND v_new_nr THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='rejected' AND v_old_nr THEN 1 ELSE 0 END),
        qf_missing_name_all         = qf_missing_name_all         + (CASE WHEN v_new_mn THEN 1 ELSE 0 END) - (CASE WHEN v_old_mn THEN 1 ELSE 0 END),
        qf_missing_name_pending     = qf_missing_name_pending     + (CASE WHEN NEW.status='pending'  AND v_new_mn THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='pending'  AND v_old_mn THEN 1 ELSE 0 END),
        qf_missing_name_approved    = qf_missing_name_approved    + (CASE WHEN NEW.status='approved' AND v_new_mn THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='approved' AND v_old_mn THEN 1 ELSE 0 END),
        qf_missing_name_rejected    = qf_missing_name_rejected    + (CASE WHEN NEW.status='rejected' AND v_new_mn THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='rejected' AND v_old_mn THEN 1 ELSE 0 END),
        qf_missing_ingredients_all      = qf_missing_ingredients_all      + (CASE WHEN v_new_mi THEN 1 ELSE 0 END) - (CASE WHEN v_old_mi THEN 1 ELSE 0 END),
        qf_missing_ingredients_pending  = qf_missing_ingredients_pending  + (CASE WHEN NEW.status='pending'  AND v_new_mi THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='pending'  AND v_old_mi THEN 1 ELSE 0 END),
        qf_missing_ingredients_approved = qf_missing_ingredients_approved + (CASE WHEN NEW.status='approved' AND v_new_mi THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='approved' AND v_old_mi THEN 1 ELSE 0 END),
        qf_missing_ingredients_rejected = qf_missing_ingredients_rejected + (CASE WHEN NEW.status='rejected' AND v_new_mi THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='rejected' AND v_old_mi THEN 1 ELSE 0 END),
        qf_user_submitted_all       = qf_user_submitted_all       + (CASE WHEN v_new_us THEN 1 ELSE 0 END) - (CASE WHEN v_old_us THEN 1 ELSE 0 END),
        qf_user_submitted_pending   = qf_user_submitted_pending   + (CASE WHEN NEW.status='pending'  AND v_new_us THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='pending'  AND v_old_us THEN 1 ELSE 0 END),
        qf_user_submitted_approved  = qf_user_submitted_approved  + (CASE WHEN NEW.status='approved' AND v_new_us THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='approved' AND v_old_us THEN 1 ELSE 0 END),
        qf_user_submitted_rejected  = qf_user_submitted_rejected  + (CASE WHEN NEW.status='rejected' AND v_new_us THEN 1 ELSE 0 END) - (CASE WHEN OLD.status='rejected' AND v_old_us THEN 1 ELSE 0 END),
        updated_at = now()
      WHERE id = 1;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 3: Instant get_quality_filter_counts from product_stats
CREATE OR REPLACE FUNCTION get_quality_filter_counts(p_status text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT jsonb_build_object(
    'missing_name', CASE p_status
      WHEN 'pending'  THEN qf_missing_name_pending  WHEN 'approved' THEN qf_missing_name_approved
      WHEN 'rejected' THEN qf_missing_name_rejected  ELSE qf_missing_name_all END,
    'missing_ingredients', CASE p_status
      WHEN 'pending'  THEN qf_missing_ingredients_pending  WHEN 'approved' THEN qf_missing_ingredients_approved
      WHEN 'rejected' THEN qf_missing_ingredients_rejected  ELSE qf_missing_ingredients_all END,
    'needs_review', CASE p_status
      WHEN 'pending'  THEN qf_needs_review_pending  WHEN 'approved' THEN qf_needs_review_approved
      WHEN 'rejected' THEN qf_needs_review_rejected  ELSE qf_needs_review_all END,
    'user_submitted', CASE p_status
      WHEN 'pending'  THEN qf_user_submitted_pending  WHEN 'approved' THEN qf_user_submitted_approved
      WHEN 'rejected' THEN qf_user_submitted_rejected  ELSE qf_user_submitted_all END
  ) FROM product_stats WHERE id = 1;
$$;
GRANT EXECUTE ON FUNCTION get_quality_filter_counts(text) TO anon;

-- Step 4: get_products_filtered uses product_stats for total, indexed query for data
CREATE OR REPLACE FUNCTION get_products_filtered(
  p_status         text DEFAULT NULL,
  p_search         text DEFAULT NULL,
  p_quality_filter text DEFAULT NULL,
  p_page           int  DEFAULT 0,
  p_page_size      int  DEFAULT 25
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total    bigint;
  v_products json;
BEGIN
  IF p_search IS NOT NULL AND p_search != '' THEN
    SELECT COUNT(*) INTO v_total FROM products p
    WHERE (p_status IS NULL OR p.status = p_status)
      AND (p.name ILIKE '%'||p_search||'%' OR p.brand ILIKE '%'||p_search||'%' OR p.barcode ILIKE '%'||p_search||'%')
      AND (p_quality_filter IS NULL OR p_quality_filter = '' OR (
            (p_quality_filter='missing_name'        AND (p.name IS NULL OR p.name=''))
         OR (p_quality_filter='missing_ingredients' AND (p.ingredients_text IS NULL OR p.ingredients_text=''))
         OR (p_quality_filter='needs_review'        AND p.name>'' AND p.ingredients_text>'')
         OR (p_quality_filter='user_submitted'      AND p.off_id IS NULL)));
  ELSE
    SELECT CASE
      WHEN p_quality_filter='missing_name' THEN
        CASE p_status WHEN 'pending' THEN qf_missing_name_pending WHEN 'approved' THEN qf_missing_name_approved WHEN 'rejected' THEN qf_missing_name_rejected ELSE qf_missing_name_all END
      WHEN p_quality_filter='missing_ingredients' THEN
        CASE p_status WHEN 'pending' THEN qf_missing_ingredients_pending WHEN 'approved' THEN qf_missing_ingredients_approved WHEN 'rejected' THEN qf_missing_ingredients_rejected ELSE qf_missing_ingredients_all END
      WHEN p_quality_filter='needs_review' THEN
        CASE p_status WHEN 'pending' THEN qf_needs_review_pending WHEN 'approved' THEN qf_needs_review_approved WHEN 'rejected' THEN qf_needs_review_rejected ELSE qf_needs_review_all END
      WHEN p_quality_filter='user_submitted' THEN
        CASE p_status WHEN 'pending' THEN qf_user_submitted_pending WHEN 'approved' THEN qf_user_submitted_approved WHEN 'rejected' THEN qf_user_submitted_rejected ELSE qf_user_submitted_all END
      ELSE
        CASE p_status WHEN 'pending' THEN pending_count WHEN 'approved' THEN approved_count WHEN 'rejected' THEN rejected_count ELSE total_count END
    END INTO v_total FROM product_stats WHERE id = 1;
  END IF;

  SELECT json_agg(row_to_json(q)) INTO v_products FROM (
    SELECT p.id, p.barcode, p.name, p.brand, p.quantity,
      p.image_front_url, p.ingredients_text, p.allergen_tags, p.diet_tags,
      p.status, p.categorization_status, p.ai_category_id, p.ai_confidence,
      p.off_id, p.review_reasons, p.has_unknown_ingredients,
      p.created_at, p.updated_at, p.approved_at,
      COALESCE((SELECT json_agg(json_build_object('category_id', pc.category_id))
                FROM product_categories pc WHERE pc.product_id = p.id), '[]'::json) AS product_categories
    FROM products p
    WHERE (p_status IS NULL OR p.status = p_status)
      AND (p_search IS NULL OR p_search='' OR (
            p.name ILIKE '%'||p_search||'%' OR p.brand ILIKE '%'||p_search||'%' OR p.barcode ILIKE '%'||p_search||'%'))
      AND (p_quality_filter IS NULL OR p_quality_filter='' OR (
            (p_quality_filter='missing_name'        AND (p.name IS NULL OR p.name=''))
         OR (p_quality_filter='missing_ingredients' AND (p.ingredients_text IS NULL OR p.ingredients_text=''))
         OR (p_quality_filter='needs_review'        AND p.name>'' AND p.ingredients_text>'')
         OR (p_quality_filter='user_submitted'      AND p.off_id IS NULL)))
    ORDER BY p.created_at DESC
    LIMIT p_page_size OFFSET p_page * p_page_size
  ) q;

  RETURN json_build_object('total', COALESCE(v_total,0), 'products', COALESCE(v_products,'[]'::json));
END;
$$;
GRANT EXECUTE ON FUNCTION get_products_filtered(text, text, text, int, int) TO anon;
