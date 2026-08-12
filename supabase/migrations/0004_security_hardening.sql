-- Hostara v2 — Phase 1 Audit Correction: Security & Referential Integrity Hardening

-- 1. Secure is_org_member function with explicit search_path to prevent search_path hijacking
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

-- 2. Preserve booking and cleaning history on property deletion (change CASCADE to RESTRICT)
-- Prevent accidental deletion of a property if past reservations exist
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_property_id_fkey,
  ADD CONSTRAINT reservations_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE RESTRICT;

-- Prevent accidental deletion of a property if past cleaning tasks exist
ALTER TABLE public.cleaning_tasks
  DROP CONSTRAINT IF EXISTS cleaning_tasks_property_id_fkey,
  ADD CONSTRAINT cleaning_tasks_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE RESTRICT;
