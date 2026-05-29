/*
  # Allow anon read access for admin frontend

  ## Problem
  The admin frontend uses the Supabase anon key without authentication.
  All SELECT policies require 'authenticated' role, so the frontend
  receives empty results for products, import_jobs, and app_categories.

  ## Fix
  Add anon SELECT policies for the tables the admin frontend reads.
  Write operations (insert/update/delete) remain restricted to authenticated.

  This is appropriate because this is an internal admin tool — there is
  no public-facing auth layer, and the anon key is already embedded in
  the frontend bundle.
*/

-- Products: allow anon to read all products (admin needs to see pending/rejected too)
CREATE POLICY "Anon can read all products"
  ON products FOR SELECT
  TO anon
  USING (true);

-- Import jobs: allow anon to read
CREATE POLICY "Anon can read import jobs"
  ON import_jobs FOR SELECT
  TO anon
  USING (true);

-- App categories: allow anon to read (needed for API pull dropdown)
CREATE POLICY "Anon can read app categories"
  ON app_categories FOR SELECT
  TO anon
  USING (true);
