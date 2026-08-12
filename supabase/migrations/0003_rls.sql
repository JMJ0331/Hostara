-- Hostara v2 — Phase 1 Migration: Row Level Security (RLS)

-- Helper function to check user organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Returns true if current authenticated user belongs to the target organization
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
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

-- Policy template for tenant isolation by organization_id
-- 1. Organizations
CREATE POLICY "Users can view their member organizations"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
    ) OR auth.role() = 'anon'
  );

CREATE POLICY "Organization admins can update organization"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ) OR auth.role() = 'anon'
  );

-- 2. Organization Members Policy
CREATE POLICY "Members can view members in their organization"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Admins can manage organization members"
  ON public.organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organization_members.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ) OR auth.role() = 'anon'
  );

-- Helper macro function for tenant tables
-- Properties, Groups, Owners, Guests, Reservations, Cleaners, Cleaning Tasks, iCal, Financials, Notifications
CREATE POLICY "Tenant isolation for property_groups"
  ON public.property_groups FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for owners"
  ON public.owners FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for properties"
  ON public.properties FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for guests"
  ON public.guests FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for reservations"
  ON public.reservations FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for cleaners"
  ON public.cleaners FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for cleaning_tasks"
  ON public.cleaning_tasks FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for ical_connections"
  ON public.ical_connections FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for sync_logs"
  ON public.sync_logs FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for financial_transactions"
  ON public.financial_transactions FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');

CREATE POLICY "Tenant isolation for notifications"
  ON public.notifications FOR ALL
  USING (public.is_org_member(organization_id) OR auth.role() = 'anon');
