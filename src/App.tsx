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
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { AuthView } from './components/AuthView';

import type { 
  Property, 
  Reservation, 
  CleaningTask, 
  Owner, 
  DashboardStats, 
  CleaningStatus 
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; id?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
  const [isNewCleaningModalOpen, setIsNewCleaningModalOpen] = useState<boolean>(false);
  const [isManageGroupsModalOpen, setIsManageGroupsModalOpen] = useState<boolean>(false);
  const [selectedReservationToEdit, setSelectedReservationToEdit] = useState<Reservation | null>(null);

  // Confirm delete popup state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: () => {}
  });

  // Fetch initial data from backend API
  const fetchAllData = async () => {
    try {
      const [statsRes, propsRes, resRes, cleanRes, ownersRes, groupsRes] = await Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/properties').then(r => r.json()),
        fetch('/api/reservations').then(r => r.json()),
        fetch('/api/cleaning-tasks').then(r => r.json()),
        fetch('/api/owners').then(r => r.json()),
        fetch('/api/groups').then(r => r.json()).catch(() => [])
      ]);

      setStats(statsRes);
      setProperties(propsRes);
      setReservations(resRes);
      setCleaningTasks(cleanRes);
      setOwners(ownersRes);
      if (Array.isArray(groupsRes)) {
        setCustomGroupsState(groupsRes);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check saved session
    const saved = localStorage.getItem('hostara_session') || sessionStorage.getItem('hostara_session');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error('Session error:', e);
      }
    }
    fetchAllData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hostara_session');
    sessionStorage.removeItem('hostara_session');
    setCurrentUser(null);
  };

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
      const res = await fetch('/api/ical/sync-all', { method: 'POST' });
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
      const response = await fetch('/api/ical/sync', {
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
      await fetch('/api/reservations', {
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
      await fetch(`/api/reservations/${id}`, {
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
      await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting reservation:', error);
    }
  };

  const handleCreateProperty = async (propData: Partial<Property>) => {
    try {
      await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propData)
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const handleCreateCleaningTask = async (taskData: Partial<CleaningTask>) => {
    try {
      await fetch('/api/cleaning-tasks', {
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
      await fetch(`/api/cleaning-tasks/${id}`, {
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
      await fetch(`/api/cleaning-tasks/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting cleaning task:', error);
    }
  };

  const handleAddOwner = async (ownerData: Partial<Owner>) => {
    try {
      await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerData)
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error adding owner:', error);
    }
  };

  const handleDeleteOwner = async (id: string) => {
    try {
      await fetch(`/api/owners/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting owner:', error);
    }
  };

  // Group / Complex CRUD
  const handleAddGroup = async (name: string) => {
    try {
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const handleUpdateGroup = async (oldName: string, newName: string) => {
    try {
      await fetch(`/api/groups/${encodeURIComponent(oldName)}`, {
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
      await fetch(`/api/groups/${encodeURIComponent(name)}`, { method: 'DELETE' });
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

  if (!currentUser) {
    return <AuthView onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col font-sans text-[#2D2D2D]">
      
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
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        
        {/* Left Sidebar Menu */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCleaningCount={cleaningTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
          activeBookingsCount={reservations.filter(r => r.status === 'active').length}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          userEmail={currentUser.email}
          onLogout={handleLogout}
        />

        {/* Main Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              reservations={filteredReservations}
              cleaningTasks={filteredCleaningTasks}
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
              onOpenNewPropModal={() => setIsNewPropModalOpen(true)}
              onOpenManageGroupsModal={() => setIsManageGroupsModalOpen(true)}
              onEditProperty={(prop) => setIsNewPropModalOpen(true)}
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
        onClose={() => setIsNewPropModalOpen(false)}
        owners={owners}
        groups={groups}
        onCreateProperty={handleCreateProperty}
      />

      <NewCleaningModal
        isOpen={isNewCleaningModalOpen}
        onClose={() => setIsNewCleaningModalOpen(false)}
        properties={properties}
        onCreateCleaningTask={handleCreateCleaningTask}
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
      />

    </div>
  );
}
