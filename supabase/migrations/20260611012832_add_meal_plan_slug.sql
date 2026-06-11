
-- Add slug to meal_plans for human-readable URLs
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs for existing meal plans (based on name + id suffix)
UPDATE meal_plans
SET slug = lower(regexp_replace(regexp_replace(trim(name), '[^a-z0-9\s-]', '', 'gi'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Make names unique per professional by appending -2, -3 etc. where needed
DO $$
DECLARE
  r RECORD;
  base_slug text;
  candidate text;
  suffix int;
BEGIN
  FOR r IN
    SELECT id, professional_id, slug FROM meal_plans ORDER BY created_at
  LOOP
    base_slug := r.slug;
    candidate := base_slug;
    suffix := 2;
    -- check uniqueness within the professional
    WHILE EXISTS (
      SELECT 1 FROM meal_plans
      WHERE professional_id = r.professional_id AND slug = candidate AND id != r.id
    ) LOOP
      candidate := base_slug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    IF candidate != r.slug THEN
      UPDATE meal_plans SET slug = candidate WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- Now add unique constraint per professional
CREATE UNIQUE INDEX IF NOT EXISTS meal_plans_pro_slug_unique ON meal_plans (professional_id, slug);

-- Function to generate a unique meal plan slug for a given professional
CREATE OR REPLACE FUNCTION generate_meal_plan_slug(p_professional_id uuid, p_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 2;
BEGIN
  base_slug := lower(regexp_replace(regexp_replace(trim(p_name), '[^a-z0-9\s-]', '', 'gi'), '\s+', '-', 'g'));
  IF base_slug = '' THEN base_slug := 'plan'; END IF;
  candidate := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM meal_plans WHERE professional_id = p_professional_id AND slug = candidate
  ) LOOP
    candidate := base_slug || '-' || suffix;
    suffix := suffix + 1;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Auto-set slug on insert if not provided
CREATE OR REPLACE FUNCTION meal_plans_set_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_meal_plan_slug(NEW.professional_id, NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS meal_plans_slug_trigger ON meal_plans;
CREATE TRIGGER meal_plans_slug_trigger
  BEFORE INSERT ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION meal_plans_set_slug();

-- RPC to get a meal plan by professional slug + plan slug (for public web page)
CREATE OR REPLACE FUNCTION get_meal_plan_by_pro_slug(p_pro_slug text, p_plan_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pro_id uuid;
  plan_record RECORD;
BEGIN
  SELECT id INTO pro_id FROM professionals WHERE slug = p_pro_slug AND status = 'approved';
  IF pro_id IS NULL THEN RETURN NULL; END IF;

  SELECT mp.*, p.name AS professional_name, p.slug AS professional_slug,
         p.title AS professional_title, p.photo_url AS professional_photo_url
  INTO plan_record
  FROM meal_plans mp
  JOIN professionals p ON p.id = mp.professional_id
  WHERE mp.professional_id = pro_id AND mp.slug = p_plan_slug AND mp.is_public = true;

  IF plan_record IS NULL THEN RETURN NULL; END IF;

  RETURN row_to_json(plan_record);
END;
$$;
