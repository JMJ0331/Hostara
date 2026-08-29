-- Hostara v2 — Phase 3 Migration: RBAC Enforcement & Multi-Tenancy Hardening

-- 1. Ensure valid role and status values on organization_members
ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check,
  ADD CONSTRAINT organization_members_role_check
    CHECK (role IN ('owner', 'admin', 'host', 'cleaner', 'member'));

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_status_check,
  ADD CONSTRAINT organization_members_status_check
    CHECK (status IN ('active', 'invited', 'suspended'));

-- 2. Helper Security Functions

-- Get user's active role in a specific organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM public.organization_members
  WHERE organization_id = p_org_id
    AND user_id = auth.uid()
    AND status = 'active';

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Check if user has one of allowed roles in specified organization
CREATE OR REPLACE FUNCTION public.has_org_role(p_org_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := public.get_user_org_role(p_org_id);
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN v_role = ANY(p_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Ensure is_org_member strictly blocks suspended members
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. RPC to invite/add or update organization members with strict server-side RBAC
CREATE OR REPLACE FUNCTION public.manage_organization_member(
  p_org_id UUID,
  p_target_email TEXT,
  p_role TEXT,
  p_status TEXT DEFAULT 'active',
  p_full_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_user_id UUID;
  v_caller_role TEXT;
  v_target_user_id UUID;
  v_existing_member RECORD;
  v_result JSONB;
BEGIN
  v_caller_user_id := auth.uid();
  IF v_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verify caller role in the organization
  v_caller_role := public.get_user_org_role(p_org_id);
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'No tienes permisos para administrar miembros en esta organización';
  END IF;

  -- Validate input role
  IF p_role NOT IN ('owner', 'admin', 'host', 'cleaner', 'member') THEN
    RAISE EXCEPTION 'Rol de usuario no válido';
  END IF;

  -- Only owners can assign the 'owner' role
  IF p_role = 'owner' AND v_caller_role != 'owner' THEN
    RAISE EXCEPTION 'Solo el propietario de la organización puede asignar el rol de Owner';
  END IF;

  -- Find target user ID by email if exists in auth.users
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(p_target_email));

  -- Check if member already exists in organization
  SELECT * INTO v_existing_member
  FROM public.organization_members
  WHERE organization_id = p_org_id
    AND (LOWER(email) = LOWER(TRIM(p_target_email)) OR (v_target_user_id IS NOT NULL AND user_id = v_target_user_id));

  IF v_existing_member.id IS NOT NULL THEN
    -- Check if trying to modify an existing owner
    IF v_existing_member.role = 'owner' AND v_caller_role != 'owner' THEN
      RAISE EXCEPTION 'Solo el propietario principal puede modificar la membresía de otro Owner';
    END IF;

    UPDATE public.organization_members
    SET 
      role = p_role,
      status = p_status,
      full_name = COALESCE(p_full_name, full_name),
      user_id = COALESCE(user_id, v_target_user_id),
      updated_at = NOW()
    WHERE id = v_existing_member.id
    RETURNING jsonb_build_object(
      'id', id,
      'email', email,
      'role', role,
      'status', status
    ) INTO v_result;

  ELSE
    -- Insert new member
    INSERT INTO public.organization_members (
      organization_id,
      user_id,
      email,
      role,
      status,
      full_name
    ) VALUES (
      p_org_id,
      v_target_user_id,
      LOWER(TRIM(p_target_email)),
      p_role,
      p_status,
      p_full_name
    )
    RETURNING jsonb_build_object(
      'id', id,
      'email', email,
      'role', role,
      'status', status
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_organization_member(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 4. Refine RLS for Financials (Restricting cleaner/member roles from accessing financial transactions)
DROP POLICY IF EXISTS "Tenant isolation for financial_transactions" ON public.financial_transactions;

CREATE POLICY "Financials tenant isolation with role check"
  ON public.financial_transactions FOR ALL TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

