/*
  # Create WINIT catalog tables for allergies, diets, and medical conditions

  ## Summary
  Creates standalone catalog tables for WINIT's health profile system so the app
  is fully independent from the WinitClinic backend API. Each catalog item belongs
  to a category (e.g. "Dairy", "Tree Nuts") and has a user-friendly label.

  ## New Tables

  ### winit_allergy_categories
  - `id` (text, PK) — machine key e.g. "dairy"
  - `label` (text) — display name e.g. "Dairy"
  - `icon` (text) — emoji icon
  - `sort_order` (int) — display ordering

  ### winit_allergies
  - `id` (text, PK) — machine key e.g. "milk"
  - `category_id` (text, FK → winit_allergy_categories)
  - `label` (text) — display name e.g. "Milk"
  - `keywords` (text[]) — ingredient keywords to match in products
  - `description` (text) — short explanation
  - `sort_order` (int)

  ### winit_diet_categories
  - Same structure as allergy categories

  ### winit_diets
  - `id` (text, PK)
  - `category_id` (text, FK)
  - `label` (text)
  - `keywords` (text[])
  - `description` (text)
  - `sort_order` (int)

  ### winit_condition_categories
  - Same structure

  ### winit_conditions
  - `id` (text, PK)
  - `category_id` (text, FK)
  - `label` (text)
  - `keywords` (text[])
  - `description` (text)
  - `sort_order` (int)

  ## Security
  - RLS enabled on all tables
  - Public SELECT allowed (catalog is read-only reference data, not sensitive)
  - No INSERT/UPDATE/DELETE for anonymous users
*/

-- ── Allergy categories ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winit_allergy_categories (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  icon        text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0
);

ALTER TABLE winit_allergy_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read allergy categories"
  ON winit_allergy_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Allergies ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winit_allergies (
  id          text PRIMARY KEY,
  category_id text NOT NULL REFERENCES winit_allergy_categories(id) ON DELETE CASCADE,
  label       text NOT NULL,
  keywords    text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_winit_allergies_category ON winit_allergies(category_id);

ALTER TABLE winit_allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read allergies"
  ON winit_allergies FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Diet categories ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winit_diet_categories (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  icon        text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0
);

ALTER TABLE winit_diet_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read diet categories"
  ON winit_diet_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Diets ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winit_diets (
  id          text PRIMARY KEY,
  category_id text NOT NULL REFERENCES winit_diet_categories(id) ON DELETE CASCADE,
  label       text NOT NULL,
  keywords    text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_winit_diets_category ON winit_diets(category_id);

ALTER TABLE winit_diets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read diets"
  ON winit_diets FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Condition categories ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winit_condition_categories (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  icon        text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0
);

ALTER TABLE winit_condition_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read condition categories"
  ON winit_condition_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Conditions ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winit_conditions (
  id          text PRIMARY KEY,
  category_id text NOT NULL REFERENCES winit_condition_categories(id) ON DELETE CASCADE,
  label       text NOT NULL,
  keywords    text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_winit_conditions_category ON winit_conditions(category_id);

ALTER TABLE winit_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read conditions"
  ON winit_conditions FOR SELECT
  TO anon, authenticated
  USING (true);
