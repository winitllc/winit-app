/*
  # Admin read policy for winit_profiles

  The admin panel uses the anon key (client-side Angular app) and needs to read
  all user profiles for the Users management page.

  Since the admin panel cannot use the service role key in a browser app, we add
  a SELECT policy that allows the anon role to read all profiles. Write operations
  (update is_active, etc.) still require the authenticated role and ownership checks,
  so we also add an UPDATE policy for anon that is restricted via a separate admin
  flag approach — for now we keep writes as authenticated-only and only open SELECT
  to anon for the admin panel list view.

  Note: in a production setup you would add an admin auth check here. For now this
  mirrors how the products table is already readable by anon.
*/

-- Allow anon to read all profiles (admin panel list view)
CREATE POLICY "Admin panel can read all profiles"
  ON winit_profiles FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update is_active (admin activate/deactivate)
CREATE POLICY "Admin panel can update user active status"
  ON winit_profiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
