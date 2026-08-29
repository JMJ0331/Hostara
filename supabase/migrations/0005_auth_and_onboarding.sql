-- Hostara v2 — Phase 2 Migration: Auth Integration, Onboarding RPC & Strict RLS

-- 1. Helper Function: RPC to create initial organization and owner member for authenticated user
CREATE OR REPLACE FUNCTION public.create_organization_for_user(
  p_name TEXT,
  p_slug TEXT,
  p_full_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_org_id UUID;
  v_result JSONB;
BEGIN
  -- Retrieve active authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Get email from auth.users or jwt
  v_user_email := COALESCE(
    auth.jwt() ->> 'email',
    (SELECT email FROM auth.users WHERE id = v_user_id)
  );

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'No se encontró correo electrónico para el usuario';
  END IF;

  -- Insert Organization
  INSERT INTO public.organizations (name, slug)
  VALUES (p_name, LOWER(TRIM(p_slug)))
  RETURNING id INTO v_org_id;

  -- Insert Organization Member as Owner
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    email,
    full_name
  ) VALUES (
    v_org_id,
    v_user_id,
    'owner',
    'active',
    v_user_email,
    p_full_name
  );

  -- Return organization details as JSON
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'slug', slug,
    'created_at', created_at
  ) INTO v_result
  FROM public.organizations
  WHERE id = v_org_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization_for_user(TEXT, TEXT, TEXT) TO authenticated;

-- 2. Clean up anonymous bypass policies and enforce strict JWT-authenticated RLS

-- Drop old policies on organizations and organization_members
DROP POLICY IF EXISTS "Users can view their member organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization admins can update organization" ON public.organizations;
DROP POLICY IF EXISTS "Members can view members in their organization" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;

-- Organizations Policies
CREATE POLICY "Authenticated users can view their member organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Organization owners and admins can update organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Organization Members Policies
CREATE POLICY "Members can view members in their organization or their own record"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_org_member(organization_id)
  );

CREATE POLICY "Admins can insert organization members"
  ON public.organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organization_members.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "Admins can update organization members"
  ON public.organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organization_members.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- 3. Replace Tenant Table Policies removing 'anon' bypass
DROP POLICY IF EXISTS "Tenant isolation for property_groups" ON public.property_groups;
DROP POLICY IF EXISTS "Tenant isolation for owners" ON public.owners;
DROP POLICY IF EXISTS "Tenant isolation for properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant isolation for guests" ON public.guests;
DROP POLICY IF EXISTS "Tenant isolation for reservations" ON public.reservations;
DROP POLICY IF EXISTS "Tenant isolation for cleaners" ON public.cleaners;
DROP POLICY IF EXISTS "Tenant isolation for cleaning_tasks" ON public.cleaning_tasks;
DROP POLICY IF EXISTS "Tenant isolation for ical_connections" ON public.ical_connections;
DROP POLICY IF EXISTS "Tenant isolation for sync_logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Tenant isolation for financial_transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Tenant isolation for notifications" ON public.notifications;

-- Enforce strict authenticated tenant isolation
CREATE POLICY "Tenant isolation for property_groups"
  ON public.property_groups FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for owners"
  ON public.owners FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for properties"
  ON public.properties FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for guests"
  ON public.guests FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for reservations"
  ON public.reservations FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for cleaners"
  ON public.cleaners FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for cleaning_tasks"
  ON public.cleaning_tasks FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for ical_connections"
  ON public.ical_connections FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for sync_logs"
  ON public.sync_logs FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for financial_transactions"
  ON public.financial_transactions FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Tenant isolation for notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.is_org_member(organization_id));

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

