/*
  # Fix anon write access for product_categories

  The admin frontend uses the anon key. product_categories only allows
  authenticated users to INSERT and DELETE, so setProductCategories fails
  silently when saving a product edit.
*/

CREATE POLICY "Anon can insert product categories"
  ON product_categories FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can delete product categories"
  ON product_categories FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Anon can update product categories"
  ON product_categories FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
