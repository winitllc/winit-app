-- Extend professionals table for self-service auth
ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS certifications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS professionals_slug_unique_idx
  ON professionals(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS professionals_auth_user_id_idx
  ON professionals(auth_user_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professionals' AND policyname='pro_select_own') THEN
    EXECUTE 'CREATE POLICY pro_select_own ON professionals FOR SELECT TO authenticated USING (auth.uid() = auth_user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professionals' AND policyname='pro_update_own') THEN
    EXECUTE 'CREATE POLICY pro_update_own ON professionals FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meal_plans' AND policyname='pro_insert_meal_plans') THEN
    EXECUTE 'CREATE POLICY pro_insert_meal_plans ON meal_plans FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND auth_user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meal_plans' AND policyname='pro_update_meal_plans') THEN
    EXECUTE 'CREATE POLICY pro_update_meal_plans ON meal_plans FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND auth_user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meal_plans' AND policyname='pro_delete_meal_plans') THEN
    EXECUTE 'CREATE POLICY pro_delete_meal_plans ON meal_plans FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND auth_user_id = auth.uid()))';
  END IF;
END $$;

-- Stats RPC for pro dashboard
CREATE OR REPLACE FUNCTION get_pro_stats(p_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'meal_plan_count',  (SELECT COUNT(*) FROM meal_plans WHERE professional_id = p_id),
    'invite_count',     (SELECT COUNT(*) FROM referral_invites WHERE professional_id = p_id),
    'conversion_count', (SELECT COUNT(*) FROM referral_conversions WHERE professional_id = p_id),
    'active_count',     (SELECT COUNT(*) FROM referral_conversions WHERE professional_id = p_id AND status = 'activated')
  );
$$;
