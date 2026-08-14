import { createClient } from '@supabase/supabase-js';

/**
 * Sanitizes and normalizes Supabase Project URL:
 * - Strips whitespace and surrounding quotes
 * - Extracts strictly the origin (protocol + host + port), removing any subpaths like /rest/v1, /auth/v1, /dashboard
 */
function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return '';

  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/+$/, '');
  }
}

/**
 * Sanitizes Supabase Anon / Publishable Key
 */
function sanitizeSupabaseKey(key?: string): string {
  if (!key) return '';
  return key.trim().replace(/^["']|["']$/g, '');
}

// Retrieve Supabase URL from Vite client environment or public aliases
const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

// Retrieve Supabase Anon / Publishable Key from Vite client environment or public aliases
const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  '';

const sanitizedUrl = sanitizeSupabaseUrl(rawUrl);
const sanitizedKey = sanitizeSupabaseKey(rawKey);

const isPlaceholder = (val: string) =>
  !val ||
  val === 'https://placeholder.supabase.co' ||
  val === 'placeholder-key' ||
  val === 'placeholder-anon-key' ||
  val.toLowerCase().includes('placeholder');

export const isSupabaseConfigured = Boolean(
  sanitizedUrl && sanitizedKey && !isPlaceholder(sanitizedUrl) && !isPlaceholder(sanitizedKey)
);

const supabaseUrl = isSupabaseConfigured ? sanitizedUrl : 'https://placeholder.supabase.co';
const supabaseKey = isSupabaseConfigured ? sanitizedKey : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
