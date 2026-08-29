-- Hostara v2 — Phase 4 Migration: Properties Hardening, Cross-Tenant Integrity & Granular RLS

-- 1. Add missing properties columns to match frontend requirements
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS platform_default TEXT DEFAULT 'Airbnb';

-- Add commission_rate to owners if not present
ALTER TABLE public.owners
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS payout_method TEXT;

-- 2. Enforce Cross-Tenant Foreign Key Integrity
-- Ensure property_groups and owners have composite unique constraints (id, organization_id)
ALTER TABLE public.property_groups
  DROP CONSTRAINT IF EXISTS property_groups_id_org_unique,
  ADD CONSTRAINT property_groups_id_org_unique UNIQUE (id, organization_id);

ALTER TABLE public.owners
  DROP CONSTRAINT IF EXISTS owners_id_org_unique,
  ADD CONSTRAINT owners_id_org_unique UNIQUE (id, organization_id);

-- Enforce that a property can only reference a group and an owner within the same organization
ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_group_same_org_fkey,
  ADD CONSTRAINT properties_group_same_org_fkey
    FOREIGN KEY (group_id, organization_id)
    REFERENCES public.property_groups(id, organization_id)
    ON DELETE SET NULL;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_owner_same_org_fkey,
  ADD CONSTRAINT properties_owner_same_org_fkey
    FOREIGN KEY (owner_id, organization_id)
    REFERENCES public.owners(id, organization_id)
    ON DELETE SET NULL;

-- 3. Granular RLS Policies for properties
DROP POLICY IF EXISTS "Tenant isolation for properties" ON public.properties;
DROP POLICY IF EXISTS "Properties select policy" ON public.properties;
DROP POLICY IF EXISTS "Properties insert policy" ON public.properties;
DROP POLICY IF EXISTS "Properties update policy" ON public.properties;
DROP POLICY IF EXISTS "Properties delete policy" ON public.properties;

-- SELECT: All active members of the organization can view properties
CREATE POLICY "Properties select policy"
  ON public.properties FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

-- INSERT: Only owners and admins can create properties in their organization
CREATE POLICY "Properties insert policy"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- UPDATE: Owners, admins, and hosts can update properties
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

-- DELETE: Only owners and admins can delete properties
CREATE POLICY "Properties delete policy"
  ON public.properties FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 4. Granular RLS Policies for property_groups
DROP POLICY IF EXISTS "Tenant isolation for property_groups" ON public.property_groups;
DROP POLICY IF EXISTS "Property groups select policy" ON public.property_groups;
DROP POLICY IF EXISTS "Property groups insert policy" ON public.property_groups;
DROP POLICY IF EXISTS "Property groups update policy" ON public.property_groups;
DROP POLICY IF EXISTS "Property groups delete policy" ON public.property_groups;

CREATE POLICY "Property groups select policy"
  ON public.property_groups FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Property groups insert policy"
  ON public.property_groups FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Property groups update policy"
  ON public.property_groups FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Property groups delete policy"
  ON public.property_groups FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 5. Granular RLS Policies for owners
DROP POLICY IF EXISTS "Tenant isolation for owners" ON public.owners;
DROP POLICY IF EXISTS "Owners select policy" ON public.owners;
DROP POLICY IF EXISTS "Owners insert policy" ON public.owners;
DROP POLICY IF EXISTS "Owners update policy" ON public.owners;
DROP POLICY IF EXISTS "Owners delete policy" ON public.owners;

CREATE POLICY "Owners select policy"
  ON public.owners FOR SELECT TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin', 'host'])
  );

CREATE POLICY "Owners insert policy"
  ON public.owners FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Owners update policy"
  ON public.owners FOR UPDATE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Owners delete policy"
  ON public.owners FOR DELETE TO authenticated
  USING (
    public.is_org_member(organization_id) AND
    public.has_org_role(organization_id, ARRAY['owner', 'admin'])
  );

-- 6. Indexes for Properties performance
CREATE INDEX IF NOT EXISTS idx_properties_org_id ON public.properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_properties_group_id ON public.properties(group_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_groups_org_id ON public.property_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_owners_org_id ON public.owners(organization_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

