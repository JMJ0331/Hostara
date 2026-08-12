import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserOrganization {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: string;
  status: string;
}

export interface AuthProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

/**
 * Sign in user with Supabase Auth
 */
export async function signInWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado. Revisa las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Register user with Supabase Auth
 */
export async function signUpWithSupabase(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        first_name: params.firstName,
        last_name: params.lastName,
        full_name: `${params.firstName} ${params.lastName}`.trim(),
        phone: params.phone || '',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail(email: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado.');
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update Password for logged-in or password-recovery session
 */
export async function updateSupabasePassword(newPassword: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado.');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign Out
 */
export async function signOutSupabase() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out of Supabase:', error.message);
  }
}

/**
 * Get active user organization membership from Supabase PostgreSQL
 */
export async function fetchUserOrganization(userId: string): Promise<UserOrganization | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        status,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.warn('Error fetching organization membership:', error.message);
      return null;
    }

    if (!data || !data.organizations) {
      return null;
    }

    const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;

    return {
      organizationId: data.organization_id,
      organizationName: org.name,
      organizationSlug: org.slug,
      role: data.role,
      status: data.status,
    };
  } catch (err) {
    console.error('Failed to query organization membership:', err);
    return null;
  }
}

/**
 * Create a new Organization & link user as Owner via PostgreSQL RPC
 */
export async function createOrganizationRPC(params: {
  name: string;
  slug: string;
  fullName?: string;
}): Promise<{ id: string; name: string; slug: string }> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado.');
  }

  const { data, error } = await supabase.rpc('create_organization_for_user', {
    p_name: params.name,
    p_slug: params.slug,
    p_full_name: params.fullName || null,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Helper to extract profile info from Supabase User metadata
 */
export function extractProfileFromUser(user: User): AuthProfile {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    firstName: meta.first_name || meta.firstName || '',
    lastName: meta.last_name || meta.lastName || '',
    phone: meta.phone || user.phone || '',
    avatarUrl: meta.avatar_url || '',
  };
}
