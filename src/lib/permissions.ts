export type UserRole = 'owner' | 'admin' | 'host' | 'cleaner' | 'member';

export type Permission =
  // Properties
  | 'properties.view'
  | 'properties.create'
  | 'properties.update'
  | 'properties.delete'
  // Reservations
  | 'reservations.view'
  | 'reservations.create'
  | 'reservations.update'
  | 'reservations.delete'
  // Cleaning
  | 'cleaning.view'
  | 'cleaning.manage'
  | 'cleaning.update_task'
  // Owners (Property Owners)
  | 'owners.view'
  | 'owners.create'
  | 'owners.update'
  | 'owners.delete'
  // Financials / Reports
  | 'financials.view'
  | 'financials.create'
  | 'financials.update'
  | 'financials.delete'
  // Organization Members
  | 'members.view'
  | 'members.invite'
  | 'members.update_role'
  | 'members.remove'
  // Settings & Organization
  | 'settings.view'
  | 'settings.update'
  | 'organization.view'
  | 'organization.update'
  | 'organization.delete';

/**
 * Central Authorization Matrix mapping roles to permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'properties.view',
    'properties.create',
    'properties.update',
    'properties.delete',
    'reservations.view',
    'reservations.create',
    'reservations.update',
    'reservations.delete',
    'cleaning.view',
    'cleaning.manage',
    'cleaning.update_task',
    'owners.view',
    'owners.create',
    'owners.update',
    'owners.delete',
    'financials.view',
    'financials.create',
    'financials.update',
    'financials.delete',
    'members.view',
    'members.invite',
    'members.update_role',
    'members.remove',
    'settings.view',
    'settings.update',
    'organization.view',
    'organization.update',
    'organization.delete',
  ],

  admin: [
    'properties.view',
    'properties.create',
    'properties.update',
    'properties.delete',
    'reservations.view',
    'reservations.create',
    'reservations.update',
    'reservations.delete',
    'cleaning.view',
    'cleaning.manage',
    'cleaning.update_task',
    'owners.view',
    'owners.create',
    'owners.update',
    'owners.delete',
    'financials.view',
    'financials.create',
    'financials.update',
    'members.view',
    'members.invite',
    'members.update_role',
    'settings.view',
    'settings.update',
    'organization.view',
    'organization.update',
  ],

  host: [
    'properties.view',
    'properties.update',
    'reservations.view',
    'reservations.create',
    'reservations.update',
    'cleaning.view',
    'cleaning.update_task',
    'owners.view',
    'settings.view',
    'organization.view',
  ],

  cleaner: [
    'cleaning.view',
    'cleaning.update_task',
    'properties.view',
    'organization.view',
  ],

  member: [
    'properties.view',
    'reservations.view',
    'cleaning.view',
    'organization.view',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Alias helper for readable authorization checks
 */
export function can(role: string | undefined | null, permission: Permission): boolean {
  return hasPermission(role, permission);
}

/**
 * Human readable role labels
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propietario de Cuenta',
  admin: 'Administrador',
  host: 'Anfitrión',
  cleaner: 'Personal de Limpieza',
  member: 'Miembro',
};

export function getRoleLabel(role: string | undefined | null): string {
  if (!role) return 'Sin Rol';
  const normalized = role.toLowerCase() as UserRole;
  return ROLE_LABELS[normalized] || role;
}

export function getRoleBadgeColor(role: string | undefined | null): string {
  switch (role?.toLowerCase()) {
    case 'owner':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'admin':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'host':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'cleaner':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'member':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
