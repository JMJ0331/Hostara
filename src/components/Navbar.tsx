import React from 'react';
import { 
  Building2, 
  CalendarSync, 
  Plus, 
  Search, 
  Home, 
  Sparkles,
  ChevronDown,
  Menu,
  Check,
  Building
} from 'lucide-react';
import type { UserOrganization } from '../services/authService';
import { getRoleLabel, getRoleBadgeColor, can } from '../lib/permissions';

interface NavbarProps {
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
  groups: string[];
  onSyncAll: () => void;
  isSyncing: boolean;
  onOpenNewResModal: () => void;
  onOpenNewPropModal: () => void;
  onOpenNewCleaningModal: () => void;
  onOpenICalModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleMobileMenu?: () => void;
  activeOrg?: UserOrganization | null;
  userOrgs?: UserOrganization[];
  onSelectOrg?: (org: UserOrganization) => void;
  onOpenCreateOrgModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedGroup,
  setSelectedGroup,
  groups,
  onSyncAll,
  isSyncing,
  onOpenNewResModal,
  onOpenNewPropModal,
  onOpenNewCleaningModal,
  onOpenICalModal,
  searchQuery,
  setSearchQuery,
  onToggleMobileMenu,
  activeOrg,
  userOrgs = [],
  onSelectOrg,
  onOpenCreateOrgModal
}) => {
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = React.useState(false);

  const quickAddRef = React.useRef<HTMLDivElement>(null);
  const orgDropdownRef = React.useRef<HTMLDivElement>(null);

  const userRole = activeOrg?.role || 'member';

  const canAddRes = can(userRole, 'reservations.create');
  const canAddProp = can(userRole, 'properties.create');
  const canAddClean = can(userRole, 'cleaning.manage') || can(userRole, 'cleaning.update_task');
  const canICal = can(userRole, 'settings.update');
  const canQuickAdd = canAddRes || canAddProp || canAddClean || canICal;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setQuickAddOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-black/5 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand, Hamburger & Active Organization Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Hamburger Menu Toggle (Mobile & Tablet) */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-white border border-black/5 text-[#2D2D2D] hover:bg-black/5 transition-all shadow-xs cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#2D2D2D] rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-xl tracking-tight text-[#2D2D2D] block leading-tight">
                Hostara
              </span>
            </div>
          </div>

          {/* Active Organization Switcher Dropdown */}
          {activeOrg && (
            <div className="relative ml-1 sm:ml-2" ref={orgDropdownRef}>
              <button
                type="button"
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white border border-black/10 rounded-xl hover:bg-black/5 transition-all cursor-pointer shadow-2xs group"
                title="Cambiar Organización Activa"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#2D2D2D] truncate max-w-[110px] sm:max-w-[160px]">
                      {activeOrg.organizationName}
                    </span>
                    <ChevronDown className="w-3 h-3 text-black/40 group-hover:text-black" />
                  </div>
                </div>
              </button>

              {orgDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white border border-black/10 rounded-2xl shadow-xl z-50 py-2 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 border-b border-black/5 text-[10px] font-bold text-black/40 uppercase tracking-wider">
                    Tus Organizaciones ({userOrgs.length})
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1">
                    {userOrgs.map((org) => {
                      const isActive = org.organizationId === activeOrg.organizationId;
                      return (
                        <button
                          key={org.organizationId}
                          onClick={() => {
                            setOrgDropdownOpen(false);
                            if (onSelectOrg && !isActive) {
                              onSelectOrg(org);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#FAFAF8] cursor-pointer transition-colors ${
                            isActive ? 'bg-[#FAFAF8] font-bold text-[#2D2D2D]' : 'text-black/70'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Building className="w-3.5 h-3.5 text-black/40 shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate text-xs">{org.organizationName}</p>
                              <p className="text-[10px] font-normal text-black/40 capitalize">
                                Rol: {getRoleLabel(org.role)}
                              </p>
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {onOpenCreateOrgModal && (
                    <div className="border-t border-black/5 pt-1 px-1">
                      <button
                        onClick={() => {
                          setOrgDropdownOpen(false);
                          onOpenCreateOrgModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#2D2D2D] hover:bg-[#FAFAF8] rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Crear Nueva Organización</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Active Role Badge */}
          {activeOrg?.role && (
            <span className={`hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(activeOrg.role)}`}>
              {getRoleLabel(activeOrg.role)}
            </span>
          )}
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-[140px] sm:max-w-xs md:max-w-md relative hidden sm:block">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-xl pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs text-[#2D2D2D] placeholder:text-black/40 focus:outline-none focus:border-black/20 transition-all shadow-xs"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Sincronizar iCal Button */}
          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="bg-white hover:bg-black/5 border border-black/5 text-[#2D2D2D] text-xs font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Sincronizar todos los calendarios iCal"
          >
            <CalendarSync className={`w-3.5 h-3.5 text-[#2D2D2D] ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          {/* Quick Add Menu (Conditioned on permissions) */}
          {canQuickAdd && (
            <div className="relative" ref={quickAddRef}>
              <button
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="bg-[#2D2D2D] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium shadow-md shadow-black/10 flex items-center gap-1.5 hover:bg-black/80 text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {quickAddOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-black/5 rounded-2xl shadow-lg z-50 py-2 text-xs animate-fade-in">
                  {canAddRes && (
                    <button
                      onClick={() => {
                        setQuickAddOpen(false);
                        onOpenNewResModal();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#FAFAF8] text-[#2D2D2D] flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#F4C7B8]" />
                      <span>Nueva Reserva</span>
                    </button>
                  )}

                  {canAddProp && (
                    <button
                      onClick={() => {
                        setQuickAddOpen(false);
                        onOpenNewPropModal();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#FAFAF8] text-[#2D2D2D] flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#D9E8D2]" />
                      <span>Nueva Propiedad</span>
                    </button>
                  )}

                  {canAddClean && (
                    <button
                      onClick={() => {
                        setQuickAddOpen(false);
                        onOpenNewCleaningModal();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#FAFAF8] text-[#2D2D2D] flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#D9D2F4]" />
                      <span>Tarea de Limpieza</span>
                    </button>
                  )}

                  {canICal && (
                    <>
                      <div className="h-[1px] bg-black/5 my-1" />
                      <button
                        onClick={() => {
                          setQuickAddOpen(false);
                          onOpenICalModal();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#FAFAF8] text-[#2D2D2D] flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Configurar iCal</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

