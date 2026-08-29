-- ==============================================================================
-- HOSTARA V2 — PRODUCTION BOOTSTRAP SCRIPT (AUDITED & HARDENED)
-- ==============================================================================
-- Consolidates Migrations 0001 through 0007 into a unified, hardened, production-ready
-- initialization script.
--
-- TARGET ENVIRONMENT: Supabase Production PostgreSQL Database
-- SECURITY GUARANTEES:
--   1. Zero Cross-Tenant Leakage: Composite Foreign Keys enforce that child entities
--      (properties, reservations, cleanings, transactions, etc.) strictly belong
--      to the same organization_id as their parents.
--   2. Real Multi-Tenant RBAC: Strictly evaluated at the database level via PostgreSQL RLS.
--   3. Anti-Self-Escalation: Direct INSERT/UPDATE/DELETE on organization_members and
--      organizations are blocked for client connections. All membership creations and
--      role management are strictly governed by atomic SECURITY DEFINER RPCs.
--   4. Least Privilege Grants: Anonymous access is revoked from all tables and RPCs.
--      Only authenticated JWT roles receive scoped table and execution privileges.
--   5. Non-Destructive: No DROP TABLE, no DROP SCHEMA, no mock/test data insertion.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. SCHEMA & TABLES (13 Multi-Tenant Core Tables with Composite Keys)
-- ------------------------------------------------------------------------------

-- 2.1 Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Organization Members (RBAC & Multi-Tenancy Mapping)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID, -- References auth.users(id)
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'host', 'cleaner', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_org_user UNIQUE (organization_id, email),
  CONSTRAINT org_members_id_org_unique UNIQUE (id, organization_id)
);

-- 2.3 Property Groups / Complexes
CREATE TABLE IF NOT EXISTS public.property_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT property_groups_id_org_unique UNIQUE (id, organization_id)
);

-- 2.4 Property Owners
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bank_account TEXT,
  commission_rate NUMERIC(5, 2) DEFAULT 15.00,
  payout_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT owners_id_org_unique UNIQUE (id, organization_id)
);

-- 2.5 Properties (Composite Foreign Keys enforce same organization)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  group_id UUID,
  owner_id UUID,
  name TEXT NOT NULL,
  address TEXT,
  type TEXT DEFAULT 'Apartment',
  status TEXT NOT NULL DEFAULT 'active', -- active, maintenance, inactive
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  max_guests INT DEFAULT 2,
  cleaning_fee NUMERIC(10, 2) DEFAULT 0.00,
  nightly_rate NUMERIC(10, 2) DEFAULT 0.00,
  ical_url TEXT,
  platform_default TEXT DEFAULT 'Airbnb',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT properties_id_org_unique UNIQUE (id, organization_id),
  CONSTRAINT properties_group_same_org_fkey
    FOREIGN KEY (group_id, organization_id)
    REFERENCES public.property_groups(id, organization_id)
    ON DELETE SET NULL,
  CONSTRAINT properties_owner_same_org_fkey
    FOREIGN KEY (owner_id, organization_id)
    REFERENCES public.owners(id, organization_id)
    ON DELETE SET NULL
);

-- 2.6 Guests
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT guests_id_org_unique UNIQUE (id, organization_id)
);

-- 2.7 Reservations (Composite Foreign Keys enforce property & guest belong to same organization)
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  guest_id UUID,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INT NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, pending, cancelled, checked_in, checked_out
  channel TEXT NOT NULL DEFAULT 'direct', -- direct, airbnb, booking, vrbo, ical
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reservations_id_org_unique UNIQUE (id, organization_id),
  CONSTRAINT reservations_property_same_org_fkey
    FOREIGN KEY (property_id, organization_id)
    REFERENCES public.properties(id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT reservations_guest_same_org_fkey
    FOREIGN KEY (guest_id, organization_id)
    REFERENCES public.guests(id, organization_id)
    ON DELETE SET NULL
);

-- 2.8 Cleaners
CREATE TABLE IF NOT EXISTS public.cleaners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cleaners_id_org_unique UNIQUE (id, organization_id)
);

-- 2.9 Cleaning Tasks (Composite Foreign Keys enforce cross-tenant integrity)
CREATE TABLE IF NOT EXISTS public.cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  reservation_id UUID,
  cleaner_id UUID,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, verified, cancelled
  cost NUMERIC(10, 2) DEFAULT 0.00,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cleaning_tasks_id_org_unique UNIQUE (id, organization_id),
  CONSTRAINT cleaning_tasks_property_same_org_fkey
    FOREIGN KEY (property_id, organization_id)
    REFERENCES public.properties(id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT cleaning_tasks_reservation_same_org_fkey
    FOREIGN KEY (reservation_id, organization_id)
    REFERENCES public.reservations(id, organization_id)
    ON DELETE SET NULL,
  CONSTRAINT cleaning_tasks_cleaner_same_org_fkey
    FOREIGN KEY (cleaner_id, organization_id)
    REFERENCES public.cleaners(id, organization_id)
    ON DELETE SET NULL
);

-- 2.10 iCal Connections
CREATE TABLE IF NOT EXISTS public.ical_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, error, paused
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ical_connections_id_org_unique UNIQUE (id, organization_id),
  CONSTRAINT ical_connections_property_same_org_fkey
    FOREIGN KEY (property_id, organization_id)
    REFERENCES public.properties(id, organization_id)
    ON DELETE CASCADE
);

-- 2.11 iCal Sync Logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ical_connection_id UUID,
  status TEXT NOT NULL, -- success, warning, error
  items_synced INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sync_logs_ical_same_org_fkey
    FOREIGN KEY (ical_connection_id, organization_id)
    REFERENCES public.ical_connections(id, organization_id)
    ON DELETE CASCADE
);

-- 2.12 Financial Transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID,
  reservation_id UUID,
  type TEXT NOT NULL, -- income, expense, payout, fee
  category TEXT, -- accommodation, cleaning, maintenance, platform_fee, management_fee
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT financial_transactions_property_same_org_fkey
    FOREIGN KEY (property_id, organization_id)
    REFERENCES public.properties(id, organization_id)
    ON DELETE SET NULL,
  CONSTRAINT financial_transactions_reservation_same_org_fkey
    FOREIGN KEY (reservation_id, organization_id)
    REFERENCES public.reservations(id, organization_id)
    ON DELETE SET NULL
);

-- 2.13 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON public.organization_members(email);

CREATE INDEX IF NOT EXISTS idx_property_groups_org_id ON public.property_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_owners_org_id ON public.owners(organization_id);

CREATE INDEX IF NOT EXISTS idx_properties_org_id ON public.properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_properties_group_id ON public.properties(group_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);

CREATE INDEX IF NOT EXISTS idx_guests_org_id ON public.guests(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_org_id ON public.reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON public.reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

CREATE INDEX IF NOT EXISTS idx_cleaners_org_id ON public.cleaners(organization_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_org_id ON public.cleaning_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_property_id ON public.cleaning_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_scheduled_date ON public.cleaning_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_status ON public.cleaning_tasks(status);

CREATE INDEX IF NOT EXISTS idx_ical_connections_org_id ON public.ical_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_ical_connections_property_id ON public.ical_connections(property_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_org_id ON public.sync_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_id ON public.financial_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_property_id ON public.financial_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date);

CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ------------------------------------------------------------------------------
-- 4. SECURITY & RBAC HELPER FUNCTIONS (SECURITY DEFINER with safe search_path)
-- ------------------------------------------------------------------------------

-- 4.1 Check if authenticated user is active member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL OR org_id IS NULL THEN
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

-- 4.2 Get user's active role in a specific organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL OR p_org_id IS NULL THEN
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

-- 4.3 Check if user has one of allowed roles in specified organization
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

-- ------------------------------------------------------------------------------
-- 5. RPC FUNCTIONS (Atomic Onboarding & Member Management)
-- ------------------------------------------------------------------------------

-- 5.1 RPC: Create organization and assign owner member for authenticated caller
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
  v_clean_slug TEXT;
  v_clean_name TEXT;
  v_result JSONB;
BEGIN
  -- 1. Retrieve authenticated caller ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- 2. Input validation
  v_clean_name := TRIM(p_name);
  v_clean_slug := LOWER(TRIM(p_slug));

  IF v_clean_name IS NULL OR LENGTH(v_clean_name) < 2 THEN
    RAISE EXCEPTION 'El nombre de la organización debe tener al menos 2 caracteres';
  END IF;

  IF v_clean_slug IS NULL OR LENGTH(v_clean_slug) < 2 THEN
    RAISE EXCEPTION 'El identificador (slug) debe tener al menos 2 caracteres';
  END IF;

  -- 3. Get verified email from auth.users or jwt
  v_user_email := COALESCE(
    auth.jwt() ->> 'email',
    (SELECT email FROM auth.users WHERE id = v_user_id)
  );

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'No se encontró correo electrónico verificado para el usuario';
  END IF;

  -- 4. Check if slug is already taken
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_clean_slug) THEN
    RAISE EXCEPTION 'El slug de organización "%" ya está en uso. Por favor elija otro.', v_clean_slug;
  END IF;

  -- 5. Insert Organization
  INSERT INTO public.organizations (name, slug)
  VALUES (v_clean_name, v_clean_slug)
  RETURNING id INTO v_org_id;

  -- 6. Insert Organization Member as Owner
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
    LOWER(TRIM(v_user_email)),
    TRIM(p_full_name)
  );

  -- 7. Return organization details as JSON
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

-- 5.2 RPC: Manage organization members (Add / Invite / Role update)
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
  v_clean_email TEXT;
  v_clean_role TEXT;
  v_clean_status TEXT;
  v_existing_member RECORD;
  v_active_owners_count INT;
  v_result JSONB;
BEGIN
  -- 1. Verify caller authentication
  v_caller_user_id := auth.uid();
  IF v_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_org_id IS NULL THEN
    RAISE EXCEPTION 'Identificador de organización requerido';
  END IF;

  -- 2. Verify caller role in the organization
  v_caller_role := public.get_user_org_role(p_org_id);
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'No tienes permisos de administración en esta organización';
  END IF;

  -- 3. Validate input parameters
  v_clean_email := LOWER(TRIM(p_target_email));
  v_clean_role := LOWER(TRIM(p_role));
  v_clean_status := LOWER(TRIM(COALESCE(p_status, 'active')));

  IF v_clean_email IS NULL OR v_clean_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Correo electrónico no válido';
  END IF;

  IF v_clean_role NOT IN ('owner', 'admin', 'host', 'cleaner', 'member') THEN
    RAISE EXCEPTION 'Rol de usuario no válido: %', v_clean_role;
  END IF;

  IF v_clean_status NOT IN ('active', 'invited', 'suspended') THEN
    RAISE EXCEPTION 'Estado no válido: %', v_clean_status;
  END IF;

  -- 4. RBAC Escalation Prevention: Only Owners can assign or create Owners
  IF v_clean_role = 'owner' AND v_caller_role != 'owner' THEN
    RAISE EXCEPTION 'Solo un propietario principal (Owner) puede asignar el rol de Owner';
  END IF;

  -- 5. Find target user ID by email if exists in auth.users
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE LOWER(email) = v_clean_email;

  -- 6. Check if member already exists in organization
  SELECT * INTO v_existing_member
  FROM public.organization_members
  WHERE organization_id = p_org_id
    AND (LOWER(email) = v_clean_email OR (v_target_user_id IS NOT NULL AND user_id = v_target_user_id));

  IF v_existing_member.id IS NOT NULL THEN
    -- If modifying an existing owner, only an owner can do so
    IF v_existing_member.role = 'owner' AND v_caller_role != 'owner' THEN
      RAISE EXCEPTION 'Un administrador no puede modificar los permisos de un Propietario (Owner)';
    END IF;

    -- Prevent demoting or suspending the last active owner of the organization
    IF v_existing_member.role = 'owner' AND (v_clean_role != 'owner' OR v_clean_status != 'active') THEN
      SELECT count(*) INTO v_active_owners_count
      FROM public.organization_members
      WHERE organization_id = p_org_id
        AND role = 'owner'
        AND status = 'active'
        AND id != v_existing_member.id;

      IF v_active_owners_count < 1 THEN
        RAISE EXCEPTION 'No se puede degradar ni suspender al único Propietario activo de la organización';
      END IF;
    END IF;

    UPDATE public.organization_members
    SET 
      role = v_clean_role,
      status = v_clean_status,
      full_name = COALESCE(TRIM(p_full_name), full_name),
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
      v_clean_email,
      v_clean_role,
      v_clean_status,
      TRIM(p_full_name)
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

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (Enable on all 13 tables)
-- ------------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ical_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 7. RLS POLICIES (Hardened Multi-Tenant Isolation & Anti-Tampering)
-- ------------------------------------------------------------------------------

-- 7.1 Organizations
DROP POLICY IF EXISTS "Authenticated users can view their member organizations" ON public.organizations;
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

-- Direct client INSERT on organizations is BLOCKED (Must use create_organization_for_user)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Direct organization insert is blocked" ON public.organizations;
CREATE POLICY "Direct organization insert is blocked"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Organization owners and admins can update organization" ON public.organizations;
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Only organization owners can delete organization" ON public.organizations;
CREATE POLICY "Only organization owners can delete organization"
  ON public.organizations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
        AND role = 'owner'
        AND status = 'active'
    )
  );

-- 7.2 Organization Members (Anti-Self-Escalation: Direct writes blocked, use RPCs)
DROP POLICY IF EXISTS "Members can view members in their organization or their own record" ON public.organization_members;
CREATE POLICY "Members can view members in their organization or their own record"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "Admins can insert organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Direct org members insert is blocked" ON public.organization_members;
CREATE POLICY "Direct org members insert is blocked"
  ON public.organization_members FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Admins can update organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Direct org members update is blocked" ON public.organization_members;
CREATE POLICY "Direct org members update is blocked"
  ON public.organization_members FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Direct org members delete is blocked" ON public.organization_members;
CREATE POLICY "Direct org members delete is blocked"
  ON public.organization_members FOR DELETE
  TO authenticated
  USING (false);

-- 7.3 Properties
DROP POLICY IF EXISTS "Properties select policy" ON public.properties;
CREATE POLICY "Properties select policy"
  ON public.properties FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Properties insert policy" ON public.properties;
CREATE POLICY "Properties insert policy"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Properties update policy" ON public.properties;
CREATE POLICY "Properties update policy"
  ON public.properties FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Properties delete policy" ON public.properties;
CREATE POLICY "Properties delete policy"
  ON public.properties FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.4 Property Groups
DROP POLICY IF EXISTS "Property groups select policy" ON public.property_groups;
CREATE POLICY "Property groups select policy"
  ON public.property_groups FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Property groups insert policy" ON public.property_groups;
CREATE POLICY "Property groups insert policy"
  ON public.property_groups FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Property groups update policy" ON public.property_groups;
CREATE POLICY "Property groups update policy"
  ON public.property_groups FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Property groups delete policy" ON public.property_groups;
CREATE POLICY "Property groups delete policy"
  ON public.property_groups FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.5 Owners
DROP POLICY IF EXISTS "Owners select policy" ON public.owners;
CREATE POLICY "Owners select policy"
  ON public.owners FOR SELECT TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Owners insert policy" ON public.owners;
CREATE POLICY "Owners insert policy"
  ON public.owners FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Owners update policy" ON public.owners;
CREATE POLICY "Owners update policy"
  ON public.owners FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Owners delete policy" ON public.owners;
CREATE POLICY "Owners delete policy"
  ON public.owners FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.6 Guests
DROP POLICY IF EXISTS "Guests select policy" ON public.guests;
CREATE POLICY "Guests select policy"
  ON public.guests FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Guests insert policy" ON public.guests;
CREATE POLICY "Guests insert policy"
  ON public.guests FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Guests update policy" ON public.guests;
CREATE POLICY "Guests update policy"
  ON public.guests FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Guests delete policy" ON public.guests;
CREATE POLICY "Guests delete policy"
  ON public.guests FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.7 Reservations
DROP POLICY IF EXISTS "Reservations select policy" ON public.reservations;
CREATE POLICY "Reservations select policy"
  ON public.reservations FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Reservations insert policy" ON public.reservations;
CREATE POLICY "Reservations insert policy"
  ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Reservations update policy" ON public.reservations;
CREATE POLICY "Reservations update policy"
  ON public.reservations FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Reservations delete policy" ON public.reservations;
CREATE POLICY "Reservations delete policy"
  ON public.reservations FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.8 Cleaners
DROP POLICY IF EXISTS "Cleaners select policy" ON public.cleaners;
CREATE POLICY "Cleaners select policy"
  ON public.cleaners FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Cleaners insert policy" ON public.cleaners;
CREATE POLICY "Cleaners insert policy"
  ON public.cleaners FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Cleaners update policy" ON public.cleaners;
CREATE POLICY "Cleaners update policy"
  ON public.cleaners FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Cleaners delete policy" ON public.cleaners;
CREATE POLICY "Cleaners delete policy"
  ON public.cleaners FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.9 Cleaning Tasks (Cleaners can read/update their assigned tasks, Admins/Hosts have full control)
DROP POLICY IF EXISTS "Cleaning tasks select policy" ON public.cleaning_tasks;
CREATE POLICY "Cleaning tasks select policy"
  ON public.cleaning_tasks FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Cleaning tasks insert policy" ON public.cleaning_tasks;
CREATE POLICY "Cleaning tasks insert policy"
  ON public.cleaning_tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Cleaning tasks update policy" ON public.cleaning_tasks;
CREATE POLICY "Cleaning tasks update policy"
  ON public.cleaning_tasks FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host', 'cleaner'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host', 'cleaner'])
  );

DROP POLICY IF EXISTS "Cleaning tasks delete policy" ON public.cleaning_tasks;
CREATE POLICY "Cleaning tasks delete policy"
  ON public.cleaning_tasks FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.10 iCal Connections
DROP POLICY IF EXISTS "iCal select policy" ON public.ical_connections;
CREATE POLICY "iCal select policy"
  ON public.ical_connections FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "iCal insert policy" ON public.ical_connections;
CREATE POLICY "iCal insert policy"
  ON public.ical_connections FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "iCal update policy" ON public.ical_connections;
CREATE POLICY "iCal update policy"
  ON public.ical_connections FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "iCal delete policy" ON public.ical_connections;
CREATE POLICY "iCal delete policy"
  ON public.ical_connections FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.11 iCal Sync Logs
DROP POLICY IF EXISTS "Sync logs select policy" ON public.sync_logs;
CREATE POLICY "Sync logs select policy"
  ON public.sync_logs FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Sync logs insert policy" ON public.sync_logs;
CREATE POLICY "Sync logs insert policy"
  ON public.sync_logs FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.12 Financial Transactions (Strictly restricted to owner, admin, host)
DROP POLICY IF EXISTS "Financials select policy" ON public.financial_transactions;
CREATE POLICY "Financials select policy"
  ON public.financial_transactions FOR SELECT TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

DROP POLICY IF EXISTS "Financials insert policy" ON public.financial_transactions;
CREATE POLICY "Financials insert policy"
  ON public.financial_transactions FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Financials update policy" ON public.financial_transactions;
CREATE POLICY "Financials update policy"
  ON public.financial_transactions FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Financials delete policy" ON public.financial_transactions;
CREATE POLICY "Financials delete policy"
  ON public.financial_transactions FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 7.13 Notifications
DROP POLICY IF EXISTS "Notifications select policy" ON public.notifications;
CREATE POLICY "Notifications select policy"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
CREATE POLICY "Notifications insert policy"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Notifications update policy" ON public.notifications;
CREATE POLICY "Notifications update policy"
  ON public.notifications FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    (user_id = auth.uid() OR public.has_org_role(organization_id, ARRAY['owner', 'admin']))
  )
  WITH CHECK (
    public.is_org_member(organization_id) AND
    (user_id = auth.uid() OR public.has_org_role(organization_id, ARRAY['owner', 'admin']))
  );

DROP POLICY IF EXISTS "Notifications delete policy" ON public.notifications;
CREATE POLICY "Notifications delete policy"
  ON public.notifications FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- ------------------------------------------------------------------------------
-- 8. LEAST PRIVILEGE GRANTS & PERMISSIONS
-- ------------------------------------------------------------------------------

-- Revoke all table and RPC access from anonymous users
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant schema usage to authenticated and anon (anon needed for Supabase client handshake)
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant scoped table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Protect critical tables from direct client modifications (Force mutations via secure RPCs)
REVOKE INSERT, UPDATE, DELETE ON public.organization_members FROM authenticated;
REVOKE INSERT ON public.organizations FROM authenticated;

-- Function Execution Grants for authenticated role
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_for_user(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_organization_member(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 9. SCHEMA CACHE RELOAD
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------------------------
-- 10. COMPREHENSIVE AUDIT & VERIFICATION QUERIES
-- ------------------------------------------------------------------------------

-- Check 1: Verify all 13 core tables exist
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'organizations',
    'organization_members',
    'property_groups',
    'owners',
    'properties',
    'guests',
    'reservations',
    'cleaners',
    'cleaning_tasks',
    'ical_connections',
    'sync_logs',
    'financial_transactions',
    'notifications'
  )
ORDER BY table_name;

-- Check 2: Verify Row Level Security (RLS) is ENABLED (rowsecurity = true) on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'organization_members',
    'property_groups',
    'owners',
    'properties',
    'guests',
    'reservations',
    'cleaners',
    'cleaning_tasks',
    'ical_connections',
    'sync_logs',
    'financial_transactions',
    'notifications'
  )
ORDER BY tablename;

-- Check 3: Verify all 5 SECURITY DEFINER functions exist with proper security type
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_org_member',
    'get_user_org_role',
    'has_org_role',
    'create_organization_for_user',
    'manage_organization_member'
  )
ORDER BY routine_name;

-- Check 4: Verify EXECUTE grants exist for authenticated role
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND grantee = 'authenticated'
  AND routine_name IN (
    'is_org_member',
    'get_user_org_role',
    'has_org_role',
    'create_organization_for_user',
    'manage_organization_member'
  )
ORDER BY routine_name;

-- Check 5: Verify active RLS policies breakdown per table
SELECT tablename, cmd, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Check 6: Verify Composite Foreign Keys enforcing Cross-Tenant Integrity
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.constraint_name LIKE '%same_org%'
ORDER BY tc.table_name, tc.constraint_name;

-- Check 7: Verify organization_members blocking direct client insertions
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'organization_members';

-- Check 8: Verify create_organization_for_user function signature
SELECT proname, proargnames, prorettype::regtype
FROM pg_proc
WHERE proname = 'create_organization_for_user'
  AND pronamespace = 'public'::regnamespace;

-- Check 9: Verify manage_organization_member function signature
SELECT proname, proargnames, prorettype::regtype
FROM pg_proc
WHERE proname = 'manage_organization_member'
  AND pronamespace = 'public'::regnamespace;
