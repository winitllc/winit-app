-- View exposing only products eligible to appear in the user-facing app.
-- Eligibility: non-empty name AND non-empty ingredients_text, regardless of status.
-- Rejected products are excluded — they were explicitly hidden by an admin.
CREATE OR REPLACE VIEW products_app_visible AS
SELECT *
FROM products
WHERE
  status != 'rejected'
  AND name IS NOT NULL AND trim(name) != ''
  AND ingredients_text IS NOT NULL AND trim(ingredients_text) != '';

-- Allow anon (mobile app) to read through the view
GRANT SELECT ON products_app_visible TO anon;
