
-- Professionals (nutritionists/dietitians)
CREATE TABLE professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT '',
  specialties text[] NOT NULL DEFAULT '{}',
  website_url text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_professionals" ON professionals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_professionals" ON professionals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_professionals" ON professionals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_professionals" ON professionals FOR DELETE TO anon, authenticated USING (true);

-- Meal plans
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT true,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_meal_plans" ON meal_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_meal_plans" ON meal_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_meal_plans" ON meal_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_meal_plans" ON meal_plans FOR DELETE TO anon, authenticated USING (true);

-- Meal plan days
CREATE TABLE meal_plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_meal_plan_days" ON meal_plan_days FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_meal_plan_days" ON meal_plan_days FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_meal_plan_days" ON meal_plan_days FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_meal_plan_days" ON meal_plan_days FOR DELETE TO anon, authenticated USING (true);

-- Meals per day (breakfast, lunch, dinner, snack)
CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  meal_type text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT meal_type_check CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_meals" ON meals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_meals" ON meals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_meals" ON meals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_meals" ON meals FOR DELETE TO anon, authenticated USING (true);

-- Foods per meal
CREATE TABLE meal_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE meal_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_meal_foods" ON meal_foods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_meal_foods" ON meal_foods FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_meal_foods" ON meal_foods FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_meal_foods" ON meal_foods FOR DELETE TO anon, authenticated USING (true);

-- Referral invites (generated when a pro shares a meal plan or profile)
CREATE TABLE referral_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE referral_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_referral_invites" ON referral_invites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_referral_invites" ON referral_invites FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_referral_invites" ON referral_invites FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_referral_invites" ON referral_invites FOR DELETE TO anon, authenticated USING (true);

-- Referral conversions (tracks signup/download/activation from invite)
CREATE TABLE referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES referral_invites(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  CONSTRAINT conversion_status_check CHECK (status IN ('invited', 'downloaded', 'active'))
);

ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_referral_conversions" ON referral_conversions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_referral_conversions" ON referral_conversions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_referral_conversions" ON referral_conversions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_referral_conversions" ON referral_conversions FOR DELETE TO anon, authenticated USING (true);

-- Index for fast slug lookup
CREATE INDEX professionals_slug_idx ON professionals(slug);
CREATE INDEX referral_invites_token_idx ON referral_invites(token);
CREATE INDEX referral_invites_professional_idx ON referral_invites(professional_id);
CREATE INDEX referral_conversions_professional_idx ON referral_conversions(professional_id);
