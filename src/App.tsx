import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PropertiesView } from './components/PropertiesView';
import { ReservationsView } from './components/ReservationsView';
import { CleaningView } from './components/CleaningView';
import { OwnersView } from './components/OwnersView';
import { ReportsView } from './components/ReportsView';
import { ICalSyncModal } from './components/ICalSyncModal';
import { NewReservationModal } from './components/modals/NewReservationModal';
import { NewPropertyModal } from './components/modals/NewPropertyModal';
import { NewCleaningModal } from './components/modals/NewCleaningModal';
import { EditReservationModal } from './components/modals/EditReservationModal';
import { ManageGroupsModal } from './components/modals/ManageGroupsModal';
import { ManageCleanersModal } from './components/modals/ManageCleanersModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { AccountSettingsModal } from './components/modals/AccountSettingsModal';
import { AuthView } from './components/AuthView';
import { OnboardingView } from './components/OnboardingView';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { 
  fetchUserOrganization, 
  fetchAllUserOrganizations,
  createOrganizationRPC,
  extractProfileFromUser, 
  signOutSupabase, 
  type UserOrganization 
} from './services/authService';
import { can } from './lib/permissions';
import { 
  fetchProperties, 
  createProperty as createPropertyDb, 
  updateProperty as updatePropertyDb, 
  deleteProperty as deletePropertyDb,
  fetchPropertyGroups,
  createPropertyGroup as createPropertyGroupDb,
  deletePropertyGroup as deletePropertyGroupDb,
  fetchOwners,
  createOwner as createOwnerDb
} from './services/propertyService';

import type { 
  Property, 
  Reservation, 
  CleaningTask, 
  Owner, 
  CleanerStaff,
  DashboardStats, 
  CleaningStatus 
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; firstName?: string; lastName?: string; phone?: string; avatarUrl?: string; id?: string } | null>(null);
  const [activeOrg, setActiveOrg] = useState<UserOrganization | null>(null);
  const [userOrgs, setUserOrgs] = useState<UserOrganization[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Org Modal
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState<boolean>(false);
  const [newOrgNameInput, setNewOrgNameInput] = useState<string>('');
  const [isCreatingOrg, setIsCreatingOrg] = useState<boolean>(false);

  // Enforce light mode across application
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Modals state
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState<boolean>(false);

  // Main Datasets
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [customGroupsState, setCustomGroupsState] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeBookings: 0,
    checkOutsToday: 0,
    checkInsToday: 0,
    pendingCleaningCount: 0,
    totalRevenue: 0,
    totalCleaningExpenses: 0,
    netIncome: 0,
    occupancyRatePercentage: 0
  });

  // Loading & Sync States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Modals state
  const [isICalModalOpen, setIsICalModalOpen] = useState<boolean>(false);
  const [isNewResModalOpen, setIsNewResModalOpen] = useState<boolean>(false);
  const [isNewPropModalOpen, setIsNewPropModalOpen] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isNewCleaningModalOpen, setIsNewCleaningModalOpen] = useState<boolean>(false);
  const [isManageGroupsModalOpen, setIsManageGroupsModalOpen] = useState<boolean>(false);
  const [isManageCleanersModalOpen, setIsManageCleanersModalOpen] = useState<boolean>(false);
  const [selectedReservationToEdit, setSelectedReservationToEdit] = useState<Reservation | null>(null);

  // Cleaners state
  const [cleaners, setCleaners] = useState<CleanerStaff[]>([
    { id: '1', name: 'María Sánchez', phone: '+52 998 111 2233', notes: 'Turno Mañana - Zona Cancún Center', active: true },
    { id: '2', name: 'Ana Martínez', phone: '+52 998 222 3344', notes: 'Turno Tarde - Unidades Complejo Rialto', active: true },
    { id: '3', name: 'Rosa Gómez', phone: '+52 998 333 4455', notes: 'Atención especial fines de semana', active: true }
  ]);

  const handleAddCleaner = (cleanerData: Omit<CleanerStaff, 'id' | 'active'>) => {
    const newCleaner: CleanerStaff = {
      id: `cl-${Date.now()}`,
      ...cleanerData,
      active: true
    };
    setCleaners(prev => [...prev, newCleaner]);
  };

  const handleUpdateCleaner = (id: string, updatedData: Partial<CleanerStaff>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
  };

  const handleDeleteCleaner = (id: string) => {
    setCleaners(prev => prev.filter(c => c.id !== id));
  };

  // Confirm modal popup state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName: string;
    confirmText?: string;
    subtitle?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    confirmText: 'Sí, Confirmar',
    subtitle: 'Esta acción requiere tu confirmación',
    onConfirm: () => {}
  });

  // Helper for user-scoped API requests
  const apiFetch = (url: string, options: RequestInit = {}) => {
    const userEmail = currentUser?.email || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };
    if (userEmail) {
      headers['x-user-email'] = userEmail;
    }
    return fetch(url, { ...options, headers });
  };

  // Fetch initial data from Supabase & backend
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      let propsData: Property[] = [];
      let ownersData: Owner[] = [];
      let groupsList: string[] = [];

      if (activeOrg?.organizationId && isSupabaseConfigured) {
        try {
          const [dbProps, dbGroups, dbOwners] = await Promise.all([
            fetchProperties(activeOrg.organizationId),
            fetchPropertyGroups(activeOrg.organizationId),
            fetchOwners(activeOrg.organizationId)
          ]);
          propsData = dbProps;
          groupsList = dbGroups.map(g => g.name);
          ownersData = dbOwners;
        } catch (dbErr: any) {
          console.error('Error fetching properties from Supabase:', dbErr);
          propsData = [];
        }
      }

      const [statsRes, resRes, cleanRes] = await Promise.all([
        apiFetch('/api/stats').then(r => r.json()).catch(() => ({})),
        apiFetch('/api/reservations').then(r => r.json()).catch(() => []),
        apiFetch('/api/cleaning-tasks').then(r => r.json()).catch(() => [])
      ]);

      setProperties(propsData);
      setOwners(ownersData);
      setCustomGroupsState(groupsList);
      setReservations(Array.isArray(resRes) ? resRes : []);
      setCleaningTasks(Array.isArray(cleanRes) ? cleanRes : []);
      setStats(statsRes && statsRes.totalRevenue !== undefined ? statsRes : {
        activeBookings: 0,
        checkOutsToday: 0,
        checkInsToday: 0,
        pendingCleaningCount: 0,
        totalRevenue: 0,
        totalCleaningExpenses: 0,
        netIncome: 0,
        occupancyRatePercentage: 0
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUserAndOrgs = async (userId: string) => {
      const orgs = await fetchAllUserOrganizations(userId);
      if (!isMounted) return;
      setUserOrgs(orgs);

      const savedOrgId = localStorage.getItem('hostara_active_org_id');
      let current = orgs.find(o => o.organizationId === savedOrgId);
      if (!current && orgs.length > 0) {
        current = orgs[0];
      }
      setActiveOrg(current || null);
    };

    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        const saved = localStorage.getItem('hostara_session') || sessionStorage.getItem('hostara_session');
        if (saved) {
          try { setCurrentUser(JSON.parse(saved)); } catch (e) { console.error('Session error:', e); }
        }
        if (isMounted) setAuthLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = extractProfileFromUser(session.user);
          if (isMounted) setCurrentUser(profile);
          await loadUserAndOrgs(session.user.id);
        } else {
          if (isMounted) {
            setCurrentUser(null);
            setActiveOrg(null);
            setUserOrgs([]);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = extractProfileFromUser(session.user);
        setCurrentUser(profile);
        await loadUserAndOrgs(session.user.id);
      } else {
        setCurrentUser(null);
        setActiveOrg(null);
        setUserOrgs([]);
      }
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser, activeOrg]);

  const handleLogout = async () => {
    localStorage.removeItem('hostara_session');
    sessionStorage.removeItem('hostara_session');
    await signOutSupabase();
    setCurrentUser(null);
    setActiveOrg(null);
  };

  const requestLogout = () => {
    setDeleteConfirmModal({
      isOpen: true,
      title: '¿Cerrar Sesión?',
      message: '¿Estás seguro de que deseas salir de tu cuenta en Hostara?',
      itemName: '',
      confirmText: 'Sí, Cerrar Sesión',
      subtitle: 'Se cerrará tu sesión activa en este dispositivo',
      onConfirm: () => handleLogout()
    });
  };

  const handleUpdateUserProfile = (updated: { email: string; firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const newObj = { ...prev, ...updated };
      localStorage.setItem('hostara_session', JSON.stringify(newObj));
      return newObj;
    });
  };

  const userDisplayName = currentUser?.firstName 
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() 
    : (currentUser?.email ? currentUser.email.split('@')[0] : 'Usuario');

  // Compute unique complex groups
  const groups = Array.from(new Set([...customGroupsState, ...properties.map(p => p.group).filter(Boolean)]));

  // Filter properties & reservations by selected complex
  const filteredProperties = selectedGroup === 'ALL'
    ? properties
    : properties.filter(p => p.group === selectedGroup);

  const filteredReservations = selectedGroup === 'ALL'
    ? reservations
    : reservations.filter(r => r.propertyGroup === selectedGroup);

  const filteredCleaningTasks = selectedGroup === 'ALL'
    ? cleaningTasks
    : cleaningTasks.filter(t => t.propertyGroup === selectedGroup);

  // Handlers
  const handleSyncAllICal = async () => {
    setIsSyncing(true);
    try {
      const res = await apiFetch('/api/ical/sync-all', { method: 'POST' });
      await fetchAllData();
    } catch (error) {
      console.error('Error syncing all iCal:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSingleICal = async (propertyId: string, icsContent?: string, url?: string) => {
    setIsSyncing(true);
    try {
      const response = await apiFetch('/api/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, icsContent, url })
      });
      const data = await response.json();
      await fetchAllData();
      return data;
    } catch (error) {
      console.error('Error syncing property iCal:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateReservation = async (resData: Partial<Reservation>) => {
    try {
      await apiFetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resData)
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };

  const handleUpdateReservation = async (id: string, updatedData: Partial<Reservation>) => {
    try {
      await apiFetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      await apiFetch(`/api/reservations/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting reservation:', error);
    }
  };

  const handleCreateProperty = async (propData: Partial<Property>) => {
    if (!activeOrg?.organizationId) {
      alert('Debes seleccionar una organización activa antes de crear propiedades.');
      return;
    }
    try {
      const newProp = await createPropertyDb(activeOrg.organizationId, propData);
      setProperties(prev => [newProp, ...prev]);
      if (newProp.group && !customGroupsState.includes(newProp.group)) {
        setCustomGroupsState(prev => [...prev, newProp.group]);
      }
      if (propData.icalUrl && newProp.id) {
        await handleSyncSingleICal(newProp.id, undefined, propData.icalUrl);
      }
    } catch (error: any) {
      console.error('Error creating property:', error);
      alert(error.message || 'Error al crear la propiedad');
    }
  };

  const handleUpdateProperty = async (id: string, propData: Partial<Property>) => {
    if (!activeOrg?.organizationId) return;
    try {
      const updated = await updatePropertyDb(id, activeOrg.organizationId, propData);
      setProperties(prev => prev.map(p => p.id === id ? updated : p));
      if (propData.icalUrl) {
        await handleSyncSingleICal(id, undefined, propData.icalUrl);
      }
    } catch (error: any) {
      console.error('Error updating property:', error);
      alert(error.message || 'Error al actualizar la propiedad');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!activeOrg?.organizationId) return;
    try {
      await deletePropertyDb(id, activeOrg.organizationId);
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('Error deleting property:', error);
      alert(error.message || 'Error al eliminar la propiedad');
    }
  };

  const handleCreateCleaningTask = async (taskData: Partial<CleaningTask>) => {
    try {
      await apiFetch('/api/cleaning-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error creating cleaning task:', error);
    }
  };

  const handleUpdateCleaningStatus = async (id: string, status: CleaningStatus, cleanerName?: string) => {
    try {
      await apiFetch(`/api/cleaning-tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assignedCleaner: cleanerName })
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error updating cleaning status:', error);
    }
  };

  const handleDeleteCleaningTask = async (id: string) => {
    try {
      await apiFetch(`/api/cleaning-tasks/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting cleaning task:', error);
    }
  };

  const handleAddOwner = async (ownerData: Partial<Owner>) => {
    if (!activeOrg?.organizationId) return;
    try {
      const newOwner = await createOwnerDb(activeOrg.organizationId, ownerData);
      setOwners(prev => [...prev, newOwner]);
    } catch (error: any) {
      console.error('Error adding owner:', error);
      alert(error.message || 'Error al registrar el propietario');
    }
  };

  const handleUpdateOwner = async (id: string, ownerData: Partial<Owner>) => {
    try {
      await apiFetch(`/api/owners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerData)
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error updating owner:', error);
    }
  };

  const handleDeleteOwner = async (id: string) => {
    try {
      await apiFetch(`/api/owners/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting owner:', error);
    }
  };

  // Group / Complex CRUD
  const handleAddGroup = async (name: string) => {
    if (!activeOrg?.organizationId || !name.trim()) return;
    try {
      await createPropertyGroupDb(activeOrg.organizationId, name.trim());
      setCustomGroupsState(prev => Array.from(new Set([...prev, name.trim()])));
    } catch (error: any) {
      console.error('Error adding group:', error);
      alert(error.message || 'Error al agregar el complejo');
    }
  };

  const handleUpdateGroup = async (oldName: string, newName: string) => {
    try {
      await apiFetch(`/api/groups/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const handleDeleteGroup = async (name: string) => {
    try {
      await apiFetch(`/api/groups/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  // Request deletion wrappers with confirmation pop-up
  const requestDeleteProperty = (id: string, name?: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación de propiedad',
      message: '¿Estás seguro de que deseas eliminar esta propiedad? Esta acción eliminará permanentemente la unidad.',
      itemName: name ? `Propiedad: ${name}` : 'Propiedad seleccionada',
      onConfirm: () => handleDeleteProperty(id)
    });
  };

  const requestDeleteReservation = (id: string, guestName?: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación de reserva',
      message: '¿Estás seguro de que deseas eliminar esta reserva?',
      itemName: guestName ? `Reserva de: ${guestName}` : 'Reserva seleccionada',
      onConfirm: () => handleDeleteReservation(id)
    });
  };

  const requestDeleteCleaningTask = (id: string, propertyName?: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación de limpieza',
      message: '¿Estás seguro de que deseas eliminar esta tarea de limpieza?',
      itemName: propertyName ? `Limpieza en: ${propertyName}` : 'Tarea seleccionada',
      onConfirm: () => handleDeleteCleaningTask(id)
    });
  };

  const requestDeleteOwner = (id: string, name?: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación de propietario',
      message: '¿Estás seguro de que deseas eliminar a este propietario?',
      itemName: name ? `Propietario: ${name}` : 'Propietario seleccionado',
      onConfirm: () => handleDeleteOwner(id)
    });
  };

  const requestDeleteGroup = (groupName: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación de complejo',
      message: '¿Estás seguro de que deseas eliminar este complejo? Las propiedades pertenecientes se reasignarán a "Unidades Individuales".',
      itemName: `Complejo: ${groupName}`,
      onConfirm: () => handleDeleteGroup(groupName)
    });
  };

  const requestDeleteCleaner = (id: string, name?: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación de personal',
      message: '¿Estás seguro de que deseas eliminar a esta persona del equipo de limpieza?',
      itemName: name ? `Personal: ${name}` : 'Personal de limpieza seleccionado',
      confirmText: 'Sí, Eliminar',
      subtitle: 'Esta acción no se puede deshacer',
      onConfirm: () => handleDeleteCleaner(id)
    });
  };

  const handleSelectOrganization = (org: UserOrganization) => {
    setActiveOrg(org);
    localStorage.setItem('hostara_active_org_id', org.organizationId);
  };

  const handleCreateOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgNameInput.trim()) return;
    setIsCreatingOrg(true);
    try {
      const slug = newOrgNameInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const result = await createOrganizationRPC({
        name: newOrgNameInput.trim(),
        slug: slug || `org-${Date.now()}`
      });
      const newOrg: UserOrganization = {
        organizationId: result.id,
        organizationName: result.name,
        organizationSlug: result.slug,
        role: 'owner',
        status: 'active'
      };
      setUserOrgs(prev => [...prev, newOrg]);
      setActiveOrg(newOrg);
      localStorage.setItem('hostara_active_org_id', newOrg.organizationId);
      setIsCreateOrgModalOpen(false);
      setNewOrgNameInput('');
    } catch (err: any) {
      alert(err.message || 'Error al crear la organización');
    } finally {
      setIsCreatingOrg(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D2D2D] text-white flex items-center justify-center font-bold text-lg mx-auto animate-pulse">
            H
          </div>
          <p className="text-xs font-semibold text-[#2D2D2D]">Verificando sesión en Hostara...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  if (isSupabaseConfigured && !activeOrg) {
    return (
      <OnboardingView
        userName={currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : undefined}
        userEmail={currentUser.email}
        onOrganizationCreated={(org) => {
          setActiveOrg({
            organizationId: org.organizationId,
            organizationName: org.organizationName,
            organizationSlug: org.organizationSlug,
            role: 'owner',
            status: 'active'
          });
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D2D2D] text-white flex items-center justify-center font-bold text-lg mx-auto animate-pulse">
            H
          </div>
          <p className="text-xs font-semibold text-[#2D2D2D]">Cargando Hostara...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col font-sans text-[#2D2D2D]">
      <PWAInstallBanner />
      
      {/* Top Navigation */}
      <Navbar
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        groups={groups}
        onSyncAll={handleSyncAllICal}
        isSyncing={isSyncing}
        onOpenNewResModal={() => setIsNewResModalOpen(true)}
        onOpenNewPropModal={() => setIsNewPropModalOpen(true)}
        onOpenNewCleaningModal={() => setIsNewCleaningModalOpen(true)}
        onOpenICalModal={() => setIsICalModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        userOrgs={userOrgs}
        activeOrg={activeOrg}
        onSelectOrg={handleSelectOrganization}
        onOpenCreateOrgModal={() => setIsCreateOrgModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
        
        {/* Left Sidebar Menu */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCleaningCount={cleaningTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
          activeBookingsCount={reservations.filter(r => r.status === 'active').length}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          userName={userDisplayName}
          userEmail={currentUser.email}
          avatarUrl={currentUser.avatarUrl}
          userRole={activeOrg?.role || 'member'}
          onLogout={requestLogout}
          onOpenAccountSettings={() => setIsAccountSettingsModalOpen(true)}
        />

        {/* Main Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              reservations={filteredReservations}
              cleaningTasks={filteredCleaningTasks}
              userName={currentUser.firstName || userDisplayName}
              onOpenNewResModal={() => setIsNewResModalOpen(true)}
              onOpenNewPropModal={() => setIsNewPropModalOpen(true)}
              onOpenNewCleaningModal={() => setIsNewCleaningModalOpen(true)}
              onOpenICalModal={() => setIsICalModalOpen(true)}
              onUpdateCleaningStatus={handleUpdateCleaningStatus}
              onSelectReservation={(res) => setSelectedReservationToEdit(res)}
            />
          )}

          {activeTab === 'properties' && (
            <PropertiesView
              properties={filteredProperties}
              groups={groups}
              userRole={activeOrg?.role}
              onOpenNewPropModal={() => {
                setEditingProperty(null);
                setIsNewPropModalOpen(true);
              }}
              onOpenManageGroupsModal={() => setIsManageGroupsModalOpen(true)}
              onEditProperty={(prop) => {
                setEditingProperty(prop);
                setIsNewPropModalOpen(true);
              }}
              onDeleteProperty={requestDeleteProperty}
              onSyncPropertyICal={(pId) => handleSyncSingleICal(pId)}
            />
          )}

          {activeTab === 'reservations' && (
            <ReservationsView
              reservations={filteredReservations}
              onOpenNewResModal={() => setIsNewResModalOpen(true)}
              onOpenICalModal={() => setIsICalModalOpen(true)}
              onSelectReservation={(res) => setSelectedReservationToEdit(res)}
              onDeleteReservation={requestDeleteReservation}
            />
          )}

          {activeTab === 'cleaning' && (
            <CleaningView
              cleaningTasks={filteredCleaningTasks}
              properties={properties}
              onOpenNewCleaningModal={() => setIsNewCleaningModalOpen(true)}
              onOpenManageCleanersModal={() => setIsManageCleanersModalOpen(true)}
              onUpdateCleaningStatus={handleUpdateCleaningStatus}
              onDeleteCleaningTask={requestDeleteCleaningTask}
            />
          )}

          {activeTab === 'owners' && (
            <OwnersView
              owners={owners}
              properties={properties}
              reservations={reservations}
              onAddOwner={handleAddOwner}
              onUpdateOwner={handleUpdateOwner}
              onDeleteOwner={requestDeleteOwner}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              properties={properties}
              reservations={reservations}
              owners={owners}
            />
          )}
        </main>

      </div>

      {/* Global Modals */}
      <ICalSyncModal
        isOpen={isICalModalOpen}
        onClose={() => setIsICalModalOpen(false)}
        properties={properties}
        onSyncProperty={handleSyncSingleICal}
        onSyncAll={handleSyncAllICal}
        isSyncing={isSyncing}
      />

      <NewReservationModal
        isOpen={isNewResModalOpen}
        onClose={() => setIsNewResModalOpen(false)}
        properties={properties}
        onCreateReservation={handleCreateReservation}
      />

      <NewPropertyModal
        isOpen={isNewPropModalOpen}
        onClose={() => {
          setIsNewPropModalOpen(false);
          setEditingProperty(null);
        }}
        owners={owners}
        groups={groups}
        propertyToEdit={editingProperty}
        onCreateProperty={handleCreateProperty}
        onUpdateProperty={handleUpdateProperty}
        onSyncPropertyICal={handleSyncSingleICal}
      />

      <NewCleaningModal
        isOpen={isNewCleaningModalOpen}
        onClose={() => setIsNewCleaningModalOpen(false)}
        properties={properties}
        cleaners={cleaners}
        onCreateCleaningTask={handleCreateCleaningTask}
      />

      <ManageCleanersModal
        isOpen={isManageCleanersModalOpen}
        onClose={() => setIsManageCleanersModalOpen(false)}
        cleaners={cleaners}
        onAddCleaner={handleAddCleaner}
        onUpdateCleaner={handleUpdateCleaner}
        onRequestDeleteCleaner={requestDeleteCleaner}
      />

      <EditReservationModal
        isOpen={!!selectedReservationToEdit}
        onClose={() => setSelectedReservationToEdit(null)}
        reservation={selectedReservationToEdit}
        onUpdateReservation={handleUpdateReservation}
      />

      <ManageGroupsModal
        isOpen={isManageGroupsModalOpen}
        onClose={() => setIsManageGroupsModalOpen(false)}
        groups={groups}
        onAddGroup={handleAddGroup}
        onUpdateGroup={handleUpdateGroup}
        onRequestDeleteGroup={requestDeleteGroup}
      />

      <ConfirmDeleteModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmModal.onConfirm}
        title={deleteConfirmModal.title}
        message={deleteConfirmModal.message}
        itemName={deleteConfirmModal.itemName}
        confirmText={deleteConfirmModal.confirmText}
        subtitle={deleteConfirmModal.subtitle}
      />

      <AccountSettingsModal
        isOpen={isAccountSettingsModalOpen}
        onClose={() => setIsAccountSettingsModalOpen(false)}
        currentUser={{
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          phone: currentUser.phone,
          avatarUrl: currentUser.avatarUrl
        }}
        onUpdateUser={handleUpdateUserProfile}
        activeOrg={activeOrg}
      />

      {/* Modal Crear Organización */}
      {isCreateOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-black/10 rounded-2xl p-6 w-full max-w-md shadow-xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h3 className="font-bold text-sm text-[#2D2D2D]">Crear Nueva Organización</h3>
              <button
                onClick={() => setIsCreateOrgModalOpen(false)}
                className="text-black/40 hover:text-black p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrganizationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#2D2D2D]">Nombre de la Organización *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cancún Luxury Rentals"
                  value={newOrgNameInput}
                  onChange={(e) => setNewOrgNameInput(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOrgModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-black/5 hover:bg-black/10 text-[#2D2D2D] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrg || !newOrgNameInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2D2D2D] hover:bg-black text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCreatingOrg ? 'Creando...' : 'Crear Organización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
