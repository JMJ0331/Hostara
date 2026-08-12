-- Hostara v2 — Phase 1 Migration: Performance Indexes

-- Organizations & Members
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON public.organization_members(email);

-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_org_id ON public.properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_properties_group_id ON public.properties(group_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);

-- Property Groups & Owners
CREATE INDEX IF NOT EXISTS idx_property_groups_org_id ON public.property_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_owners_org_id ON public.owners(organization_id);

-- Guests & Reservations
CREATE INDEX IF NOT EXISTS idx_guests_org_id ON public.guests(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_org_id ON public.reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON public.reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- Cleaners & Cleaning Tasks
CREATE INDEX IF NOT EXISTS idx_cleaners_org_id ON public.cleaners(organization_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_org_id ON public.cleaning_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_property_id ON public.cleaning_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_scheduled_date ON public.cleaning_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_status ON public.cleaning_tasks(status);

-- iCal & Sync Logs
CREATE INDEX IF NOT EXISTS idx_ical_connections_org_id ON public.ical_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_ical_connections_property_id ON public.ical_connections(property_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_org_id ON public.sync_logs(organization_id);

-- Financial Transactions & Notifications
CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_id ON public.financial_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_property_id ON public.financial_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
