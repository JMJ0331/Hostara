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

export interface OrganizationMemberInfo {
  id: string;
  userId?: string;
  email: string;
  role: string;
  status: string;
  fullName?: string;
  createdAt?: string;
}

/**
 * Get ALL active user organization memberships from Supabase PostgreSQL
 */
export async function fetchAllUserOrganizations(userId: string): Promise<UserOrganization[]> {
  if (!isSupabaseConfigured || !userId) return [];

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
      .eq('status', 'active');

    if (error) {
      console.warn('Error fetching organization memberships:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data
      .filter((item) => item.organizations)
      .map((item) => {
        const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
        return {
          organizationId: item.organization_id,
          organizationName: org.name,
          organizationSlug: org.slug,
          role: item.role,
          status: item.status,
        };
      });
  } catch (err) {
    console.error('Failed to query organization memberships:', err);
    return [];
  }
}

/**
 * Get single active user organization (backwards compatible wrapper)
 */
export async function fetchUserOrganization(userId: string): Promise<UserOrganization | null> {
  const orgs = await fetchAllUserOrganizations(userId);
  return orgs.length > 0 ? orgs[0] : null;
}

/**
 * Fetch all members of a specific organization
 */
export async function fetchUserOrganizationMembers(orgId: string): Promise<OrganizationMemberInfo[]> {
  if (!isSupabaseConfigured || !orgId) return [];

  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('id, user_id, email, role, status, full_name, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching organization members:', error.message);
      return [];
    }

    return (data || []).map((m) => ({
      id: m.id,
      userId: m.user_id,
      email: m.email,
      role: m.role,
      status: m.status,
      fullName: m.full_name || '',
      createdAt: m.created_at,
    }));
  } catch (err) {
    console.error('Failed to query organization members:', err);
    return [];
  }
}

/**
 * Manage (invite/update) Organization Member via PostgreSQL RPC
 */
export async function manageOrganizationMemberRPC(params: {
  orgId: string;
  targetEmail: string;
  role: string;
  status?: string;
  fullName?: string;
}): Promise<any> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado.');
  }

  const { data, error } = await supabase.rpc('manage_organization_member', {
    p_org_id: params.orgId,
    p_target_email: params.targetEmail,
    p_role: params.role,
    p_status: params.status || 'active',
    p_full_name: params.fullName || null,
  });

  if (error) {
    throw error;
  }

  return data;
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
