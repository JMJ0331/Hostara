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

import type { 
  Property, 
  Reservation, 
  CleaningTask, 
  Owner, 
  DashboardStats, 
  CleaningStatus 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Main Datasets
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
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
  const [selectedReservationToEdit, setSelectedReservationToEdit] = useState<Reservation | null>(null);

  // Fetch initial data from backend API
  const fetchAllData = async () => {
    try {
      const [statsRes, propsRes, resRes, cleanRes, ownersRes] = await Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/properties').then(r => r.json()),
        fetch('/api/reservations').then(r => r.json()),
        fetch('/api/cleaning-tasks').then(r => r.json()),
        fetch('/api/owners').then(r => r.json())
      ]);

      setStats(statsRes);
      setProperties(propsRes);
      setReservations(resRes);
      setCleaningTasks(cleanRes);
      setOwners(ownersRes);
    } catch (err) {
      console.error('Error fetching RentasMaster data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute unique complex groups
  const groups = Array.from(new Set(properties.map(p => p.group).filter(Boolean)));

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D2D2D] text-white flex items-center justify-center font-bold text-base mx-auto animate-pulse">
            RM
          </div>
          <p className="text-xs font-semibold text-[#2D2D2D]">Cargando RentasMaster...</p>
        </div>
      </div>
    );
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
              onEditProperty={(prop) => setIsNewPropModalOpen(true)}
              onDeleteProperty={handleDeleteProperty}
              onSyncPropertyICal={(pId) => handleSyncSingleICal(pId)}
            />
          )}

          {activeTab === 'reservations' && (
            <ReservationsView
              reservations={filteredReservations}
              onOpenNewResModal={() => setIsNewResModalOpen(true)}
              onOpenICalModal={() => setIsICalModalOpen(true)}
              onSelectReservation={(res) => setSelectedReservationToEdit(res)}
              onDeleteReservation={handleDeleteReservation}
            />
          )}

          {activeTab === 'cleaning' && (
            <CleaningView
              cleaningTasks={filteredCleaningTasks}
              properties={properties}
              onOpenNewCleaningModal={() => setIsNewCleaningModalOpen(true)}
              onUpdateCleaningStatus={handleUpdateCleaningStatus}
              onDeleteCleaningTask={handleDeleteCleaningTask}
            />
          )}

          {activeTab === 'owners' && (
            <OwnersView
              owners={owners}
              properties={properties}
              reservations={reservations}
              onAddOwner={handleAddOwner}
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

    </div>
  );
}
