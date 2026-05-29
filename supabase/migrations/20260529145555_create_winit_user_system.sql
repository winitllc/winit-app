/*
  # WINIT Standalone User System

  ## Summary
  Creates a fully independent WINIT user system decoupled from WinitClinic/Cognito.
  Uses Supabase Auth (auth.users) as the identity layer, with additional profile
  and health data stored in the public schema.

  ## New Tables

  ### winit_profiles
  Extended user profile linked to auth.users.
  - id: matches auth.users.id (uuid)
  - email, first_name, last_name, display_name, avatar_url
  - points_balance, points_all_time, scans_all_time
  - winitclinic_user_id: nullable, for optional future migration link
  - email_verified, is_active, onboarding_completed
  - created_at, updated_at

  ### winit_user_allergies
  Many-to-many: which allergy IDs a user has selected.
  - user_id (FK → winit_profiles.id)
  - allergy_id: string ID referencing the existing allergies catalog

  ### winit_user_diets
  Many-to-many: which lifestyle diet IDs a user follows.
  - user_id (FK → winit_profiles.id)
  - diet_id: string ID referencing the existing diets catalog

  ### winit_user_conditions
  Many-to-many: which medical condition IDs a user has.
  - user_id (FK → winit_profiles.id)
  - condition_id: string ID referencing the existing conditions catalog

  ### winit_scan_history
  Product scan log per user.
  - user_id, barcode, product_id (nullable FK → products), scanned_at

  ### winit_favorites
  User-saved products.
  - user_id, product_id (FK → products), saved_at

  ## Security
  - RLS enabled on all tables
  - Users can only read/write their own data
  - Admin reads via service role (bypasses RLS)
*/

-- ─── winit_profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS winit_profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text NOT NULL,
  first_name            text NOT NULL DEFAULT '',
  last_name             text NOT NULL DEFAULT '',
  display_name          text NOT NULL DEFAULT '',
  avatar_url            text NOT NULL DEFAULT '',
  points_balance        integer NOT NULL DEFAULT 0,
  points_all_time       integer NOT NULL DEFAULT 0,
  scans_all_time        integer NOT NULL DEFAULT 0,
  onboarding_completed  boolean NOT NULL DEFAULT false,
  is_active             boolean NOT NULL DEFAULT true,
  winitclinic_user_id   text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE winit_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON winit_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON winit_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON winit_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ─── winit_user_allergies ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS winit_user_allergies (
  user_id     uuid NOT NULL REFERENCES winit_profiles(id) ON DELETE CASCADE,
  allergy_id  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, allergy_id)
);

ALTER TABLE winit_user_allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allergies"
  ON winit_user_allergies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allergies"
  ON winit_user_allergies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergies"
  ON winit_user_allergies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── winit_user_diets ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS winit_user_diets (
  user_id     uuid NOT NULL REFERENCES winit_profiles(id) ON DELETE CASCADE,
  diet_id     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, diet_id)
);

ALTER TABLE winit_user_diets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diets"
  ON winit_user_diets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diets"
  ON winit_user_diets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diets"
  ON winit_user_diets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── winit_user_conditions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS winit_user_conditions (
  user_id       uuid NOT NULL REFERENCES winit_profiles(id) ON DELETE CASCADE,
  condition_id  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, condition_id)
);

ALTER TABLE winit_user_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conditions"
  ON winit_user_conditions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conditions"
  ON winit_user_conditions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conditions"
  ON winit_user_conditions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── winit_scan_history ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS winit_scan_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES winit_profiles(id) ON DELETE CASCADE,
  barcode     text NOT NULL,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  scanned_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_user ON winit_scan_history(user_id, scanned_at DESC);

ALTER TABLE winit_scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan history"
  ON winit_scan_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan history"
  ON winit_scan_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ─── winit_favorites ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS winit_favorites (
  user_id     uuid NOT NULL REFERENCES winit_profiles(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  saved_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE winit_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON winit_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON winit_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON winit_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── auto-update updated_at ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_winit_profiles_updated_at'
  ) THEN
    CREATE TRIGGER trg_winit_profiles_updated_at
      BEFORE UPDATE ON winit_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
