/*
  # Fix admin write permissions

  ## Problem
  The admin frontend uses the anon key. Products table only has anon SELECT.
  UPDATE/INSERT for products and ai_correction_log fail silently.

  ## Fix
  Add anon UPDATE and DELETE policies on products so product edits save.
  Also add anon write on product_taxonomy so review queue corrections persist.
*/

-- Products: allow anon to update and delete (admin panel manages all products)
CREATE POLICY "Anon can update products"
  ON products FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete products"
  ON products FOR DELETE
  TO anon
  USING (true);

-- product_taxonomy: allow anon write
CREATE POLICY "Anon can insert product_taxonomy"
  ON product_taxonomy FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update product_taxonomy"
  ON product_taxonomy FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
