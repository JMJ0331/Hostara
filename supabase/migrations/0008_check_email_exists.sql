-- Hostara — Migration 0008: check_email_exists RPC for password recovery feedback
-- Allows public (anon + authenticated) clients to verify if an email has an auth account,
-- so forgot-password can tell the user when the email is not registered.
-- NOTE: this intentionally enables email enumeration on this endpoint (requested UX).

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_email IS NULL OR TRIM(p_email) = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(p_email))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
