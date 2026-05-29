/*
  # Product Contributions System

  ## Summary
  Creates the community product contribution system where mobile users can submit
  missing product images/data, admins review submissions, and approved submissions
  update the product record.

  ## New Tables

  ### product_contributions
  - `id` (uuid, primary key)
  - `product_id` (uuid, FK → products.id) — the product being contributed to
  - `user_id` (uuid, FK → winit_profiles.id) — who submitted it
  - `field` (text) — which field: 'image_front', 'image_ingredients', 'image_nutrition', 'image_barcode', 'ingredients_text'
  - `image_url` (text) — public URL of uploaded image (null for text-only)
  - `extracted_text` (text) — AI-extracted ingredient text (for image_ingredients field)
  - `raw_text` (text) — manually typed text (alternative to AI extraction)
  - `status` (text) — 'pending' | 'approved' | 'rejected'
  - `admin_notes` (text) — admin feedback on rejection
  - `reviewed_by` (text) — admin identifier
  - `reviewed_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Users can INSERT their own contributions (authenticated)
  - Users can SELECT their own contributions
  - Anon can SELECT all (admin panel uses anon key)
  - Anon can UPDATE status/review fields (admin panel moderation)
*/

CREATE TABLE IF NOT EXISTS product_contributions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES winit_profiles(id) ON DELETE SET NULL,
  field         text NOT NULL CHECK (field IN ('image_front','image_ingredients','image_nutrition','image_barcode','ingredients_text')),
  image_url     text,
  extracted_text text,
  raw_text      text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes   text DEFAULT '',
  reviewed_by   text DEFAULT '',
  reviewed_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE product_contributions ENABLE ROW LEVEL SECURITY;

-- Users can view their own contributions
CREATE POLICY "Users can view own contributions"
  ON product_contributions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own contributions
CREATE POLICY "Users can insert own contributions"
  ON product_contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anon (admin panel) can read all contributions
CREATE POLICY "Anon can read contributions for admin"
  ON product_contributions FOR SELECT
  TO anon
  USING (true);

-- Anon (admin panel) can update status and review fields
CREATE POLICY "Anon can update contribution status"
  ON product_contributions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Index for product lookups and status filtering
CREATE INDEX IF NOT EXISTS idx_contributions_product ON product_contributions (product_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status  ON product_contributions (status);
CREATE INDEX IF NOT EXISTS idx_contributions_user    ON product_contributions (user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_field   ON product_contributions (field, status);
