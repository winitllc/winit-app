/*
  # Allow admin writes on catalog tables

  ## Summary
  Adds INSERT, UPDATE, DELETE policies for the anon role on all catalog tables.
  The admin panel uses the anon key (client-side), so these policies allow full
  catalog management from the admin UI.

  ## Security Note
  These tables contain reference data only (no PII). The admin panel is the only
  consumer that writes to them. In a production environment with public exposure
  you would restrict writes to a service-role key or an authenticated admin role.

  ## Tables affected
  - winit_allergy_categories
  - winit_allergies
  - winit_diet_categories
  - winit_diets
  - winit_condition_categories
  - winit_conditions
*/

-- ── winit_allergy_categories ──────────────────────────────────────────────────
CREATE POLICY "Admin can insert allergy categories"
  ON winit_allergy_categories FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can update allergy categories"
  ON winit_allergy_categories FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin can delete allergy categories"
  ON winit_allergy_categories FOR DELETE TO anon USING (true);

-- ── winit_allergies ───────────────────────────────────────────────────────────
CREATE POLICY "Admin can insert allergies"
  ON winit_allergies FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can update allergies"
  ON winit_allergies FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin can delete allergies"
  ON winit_allergies FOR DELETE TO anon USING (true);

-- ── winit_diet_categories ─────────────────────────────────────────────────────
CREATE POLICY "Admin can insert diet categories"
  ON winit_diet_categories FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can update diet categories"
  ON winit_diet_categories FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin can delete diet categories"
  ON winit_diet_categories FOR DELETE TO anon USING (true);

-- ── winit_diets ───────────────────────────────────────────────────────────────
CREATE POLICY "Admin can insert diets"
  ON winit_diets FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can update diets"
  ON winit_diets FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin can delete diets"
  ON winit_diets FOR DELETE TO anon USING (true);

-- ── winit_condition_categories ────────────────────────────────────────────────
CREATE POLICY "Admin can insert condition categories"
  ON winit_condition_categories FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can update condition categories"
  ON winit_condition_categories FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin can delete condition categories"
  ON winit_condition_categories FOR DELETE TO anon USING (true);

-- ── winit_conditions ──────────────────────────────────────────────────────────
CREATE POLICY "Admin can insert conditions"
  ON winit_conditions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin can update conditions"
  ON winit_conditions FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin can delete conditions"
  ON winit_conditions FOR DELETE TO anon USING (true);
