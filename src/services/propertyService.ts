import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Property, Owner, Platform } from '../types';

export interface PropertyGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface DbOwner {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  bankAccount?: string;
  commissionRate?: number;
  payoutMethod?: string;
  notes?: string;
}

export interface DbProperty {
  id: string;
  organization_id: string;
  group_id?: string | null;
  owner_id?: string | null;
  name: string;
  address?: string | null;
  type?: string | null;
  status: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  cleaning_fee?: number | null;
  nightly_rate?: number | null;
  ical_url?: string | null;
  platform_default?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  property_groups?: {
    id: string;
    name: string;
  } | null;
  owners?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

// Convert DB Property with joined relations to UI Property
export function mapDbPropertyToUi(dbProp: DbProperty): Property {
  return {
    id: dbProp.id,
    name: dbProp.name,
    group: dbProp.property_groups?.name || 'Unidades Individuales',
    ownerId: dbProp.owner_id || undefined,
    ownerName: dbProp.owners?.name || undefined,
    ownerEmail: dbProp.owners?.email || undefined,
    ownerPhone: dbProp.owners?.phone || undefined,
    cleaningCost: dbProp.cleaning_fee != null ? Number(dbProp.cleaning_fee) : 0,
    nightlyRateDefault: dbProp.nightly_rate != null ? Number(dbProp.nightly_rate) : 0,
    bedrooms: dbProp.bedrooms != null ? Number(dbProp.bedrooms) : 1,
    bathrooms: dbProp.bathrooms != null ? Number(dbProp.bathrooms) : 1,
    capacity: dbProp.max_guests != null ? Number(dbProp.max_guests) : 2,
    platformDefault: (dbProp.platform_default as Platform) || 'Airbnb',
    address: dbProp.address || '',
    active: dbProp.status === 'active',
    notes: dbProp.notes || '',
    icalUrl: dbProp.ical_url || ''
  };
}

/**
 * Fetch all properties for a specific organization from Supabase PostgreSQL
 */
export async function fetchProperties(organizationId: string): Promise<Property[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      organization_id,
      group_id,
      owner_id,
      name,
      address,
      type,
      status,
      bedrooms,
      bathrooms,
      max_guests,
      cleaning_fee,
      nightly_rate,
      ical_url,
      platform_default,
      notes,
      created_at,
      updated_at,
      property_groups (
        id,
        name
      ),
      owners (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching properties from Supabase:', error);
    throw new Error(translatePostgreSQLError(error.message || 'Error al obtener propiedades'));
  }

  return (data || []).map((p: any) => mapDbPropertyToUi(p as DbProperty));
}

/**
 * Fetch a single property by ID
 */
export async function fetchPropertyById(propertyId: string, organizationId: string): Promise<Property | null> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      organization_id,
      group_id,
      owner_id,
      name,
      address,
      type,
      status,
      bedrooms,
      bathrooms,
      max_guests,
      cleaning_fee,
      nightly_rate,
      ical_url,
      platform_default,
      notes,
      created_at,
      updated_at,
      property_groups (
        id,
        name
      ),
      owners (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('id', propertyId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching property by id:', error);
    throw new Error(translatePostgreSQLError(error.message));
  }

  if (!data) return null;
  return mapDbPropertyToUi(data as unknown as DbProperty);
}

/**
 * Ensure property group exists in DB or create it
 */
export async function getOrCreatePropertyGroup(organizationId: string, groupName: string): Promise<string | null> {
  if (!groupName || groupName.trim() === '' || groupName === 'Sin Complejo' || groupName === 'Unidades Individuales') {
    return null;
  }

  const trimmed = groupName.trim();

  // Check if group already exists
  const { data: existing, error: findError } = await supabase
    .from('property_groups')
    .select('id')
    .eq('organization_id', organizationId)
    .ilike('name', trimmed)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  // Create new group
  const { data: created, error: insertError } = await supabase
    .from('property_groups')
    .insert({
      organization_id: organizationId,
      name: trimmed
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error creating property group:', insertError);
    return null;
  }

  return created.id;
}

/**
 * Create a new Property in PostgreSQL
 */
export async function createProperty(
  organizationId: string,
  payload: Partial<Property>
): Promise<Property> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado');
  }

  if (!organizationId) {
    throw new Error('Organización requerida para crear la propiedad');
  }

  if (!payload.name || payload.name.trim() === '') {
    throw new Error('El nombre de la propiedad es obligatorio');
  }

  // Resolve group_id
  let groupId: string | null = null;
  if (payload.group) {
    groupId = await getOrCreatePropertyGroup(organizationId, payload.group);
  }

  const insertPayload = {
    organization_id: organizationId,
    name: payload.name.trim(),
    group_id: groupId,
    owner_id: payload.ownerId || null,
    address: payload.address || null,
    type: 'Apartment',
    status: payload.active === false ? 'inactive' : 'active',
    bedrooms: payload.bedrooms ?? 1,
    bathrooms: payload.bathrooms ?? 1,
    max_guests: payload.capacity ?? 2,
    cleaning_fee: payload.cleaningCost ?? 0,
    nightly_rate: payload.nightlyRateDefault ?? 0,
    ical_url: payload.icalUrl || null,
    platform_default: payload.platformDefault || 'Airbnb',
    notes: payload.notes || null
  };

  const { data, error } = await supabase
    .from('properties')
    .insert(insertPayload)
    .select(`
      id,
      organization_id,
      group_id,
      owner_id,
      name,
      address,
      type,
      status,
      bedrooms,
      bathrooms,
      max_guests,
      cleaning_fee,
      nightly_rate,
      ical_url,
      platform_default,
      notes,
      created_at,
      updated_at,
      property_groups (
        id,
        name
      ),
      owners (
        id,
        name,
        email,
        phone
      )
    `)
    .single();

  if (error) {
    console.error('Error inserting property to Supabase:', error);
    throw new Error(translatePostgreSQLError(error.message));
  }

  return mapDbPropertyToUi(data as unknown as DbProperty);
}

/**
 * Update an existing Property in PostgreSQL
 */
export async function updateProperty(
  propertyId: string,
  organizationId: string,
  payload: Partial<Property>
): Promise<Property> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado');
  }

  // Resolve group_id if group was provided
  let groupId: string | null | undefined = undefined;
  if (payload.group !== undefined) {
    groupId = await getOrCreatePropertyGroup(organizationId, payload.group);
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (groupId !== undefined) updateData.group_id = groupId;
  if (payload.ownerId !== undefined) updateData.owner_id = payload.ownerId || null;
  if (payload.address !== undefined) updateData.address = payload.address;
  if (payload.active !== undefined) updateData.status = payload.active ? 'active' : 'inactive';
  if (payload.bedrooms !== undefined) updateData.bedrooms = Number(payload.bedrooms);
  if (payload.bathrooms !== undefined) updateData.bathrooms = Number(payload.bathrooms);
  if (payload.capacity !== undefined) updateData.max_guests = Number(payload.capacity);
  if (payload.cleaningCost !== undefined) updateData.cleaning_fee = Number(payload.cleaningCost);
  if (payload.nightlyRateDefault !== undefined) updateData.nightly_rate = Number(payload.nightlyRateDefault);
  if (payload.icalUrl !== undefined) updateData.ical_url = payload.icalUrl;
  if (payload.platformDefault !== undefined) updateData.platform_default = payload.platformDefault;
  if (payload.notes !== undefined) updateData.notes = payload.notes;

  const { data, error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', propertyId)
    .eq('organization_id', organizationId)
    .select(`
      id,
      organization_id,
      group_id,
      owner_id,
      name,
      address,
      type,
      status,
      bedrooms,
      bathrooms,
      max_guests,
      cleaning_fee,
      nightly_rate,
      ical_url,
      platform_default,
      notes,
      created_at,
      updated_at,
      property_groups (
        id,
        name
      ),
      owners (
        id,
        name,
        email,
        phone
      )
    `)
    .single();

  if (error) {
    console.error('Error updating property in Supabase:', error);
    throw new Error(translatePostgreSQLError(error.message));
  }

  return mapDbPropertyToUi(data as unknown as DbProperty);
}

/**
 * Delete a Property in PostgreSQL
 */
export async function deleteProperty(
  propertyId: string,
  organizationId: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting property in Supabase:', error);
    throw new Error(translatePostgreSQLError(error.message));
  }
}

/**
 * Fetch Property Groups for an organization
 */
export async function fetchPropertyGroups(organizationId: string): Promise<PropertyGroup[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('property_groups')
    .select('id, organization_id, name, description, created_at')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  return (data || []).map((g: any) => ({
    id: g.id,
    organizationId: g.organization_id,
    name: g.name,
    description: g.description,
    createdAt: g.created_at
  }));
}

/**
 * Create a new property group
 */
export async function createPropertyGroup(
  organizationId: string,
  name: string,
  description?: string
): Promise<PropertyGroup> {
  if (!isSupabaseConfigured) throw new Error('Supabase no configurado');

  const { data, error } = await supabase
    .from('property_groups')
    .insert({
      organization_id: organizationId,
      name: name.trim(),
      description: description || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(translatePostgreSQLError(error.message));
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at
  };
}

/**
 * Delete a property group
 */
export async function deletePropertyGroup(
  groupId: string,
  organizationId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('property_groups')
    .delete()
    .eq('id', groupId)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(translatePostgreSQLError(error.message));
  }
}

/**
 * Fetch Owners for an organization
 */
export async function fetchOwners(organizationId: string): Promise<Owner[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('owners')
    .select('id, name, email, phone, commission_rate, payout_method, bank_account')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching owners:', error);
    return [];
  }

  return (data || []).map((o: any) => ({
    id: o.id,
    name: o.name,
    email: o.email || '',
    phone: o.phone || '',
    commissionRate: o.commission_rate != null ? Number(o.commission_rate) : 15,
    payoutMethod: o.payout_method || 'Transferencia SPEI',
    accountNumber: o.bank_account || ''
  }));
}

/**
 * Create a new Owner in PostgreSQL
 */
export async function createOwner(
  organizationId: string,
  payload: Partial<Owner>
): Promise<Owner> {
  if (!isSupabaseConfigured) throw new Error('Supabase no configurado');

  const { data, error } = await supabase
    .from('owners')
    .insert({
      organization_id: organizationId,
      name: payload.name?.trim() || 'Nuevo Propietario',
      email: payload.email || null,
      phone: payload.phone || null,
      commission_rate: payload.commissionRate ?? 15,
      payout_method: payload.payoutMethod || 'Transferencia SPEI',
      bank_account: payload.accountNumber || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(translatePostgreSQLError(error.message));
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    commissionRate: Number(data.commission_rate || 15),
    payoutMethod: data.payout_method || 'Transferencia SPEI',
    accountNumber: data.bank_account || ''
  };
}

/**
 * Translate database errors into clean Spanish user-friendly messages
 */
function translatePostgreSQLError(msg: string): string {
  if (!msg) return 'Ocurrió un error inesperado al procesar la solicitud.';

  if (msg.includes('foreign key constraint') || msg.includes('violates foreign key') || msg.includes('reservations_property_id_fkey') || msg.includes('cleaning_tasks_property_id_fkey')) {
    return 'No se puede eliminar esta propiedad porque tiene historial de reservas o tareas de limpieza vinculadas.';
  }

  if (msg.includes('permission denied') || msg.includes('violates row-level security') || msg.includes('row-level security policy')) {
    return 'No tienes permisos suficientes en esta organización para realizar esta acción.';
  }

  if (msg.includes('unique constraint') || msg.includes('duplicate key')) {
    return 'Ya existe un registro con estos datos únicos.';
  }

  return msg;
}
