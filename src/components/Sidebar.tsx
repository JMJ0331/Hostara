import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CalendarDays, 
  Sparkles, 
  Users, 
  BarChart3,
  X
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'properties' | 'reservations' | 'cleaning' | 'owners' | 'reports';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCleaningCount: number;
  activeBookingsCount: number;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCleaningCount,
  activeBookingsCount,
  isMobileMenuOpen = false,
  onCloseMobileMenu
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'properties' as ActiveTab,
      label: 'Propiedades',
      icon: Building2,
      badge: null
    },
    {
      id: 'reservations' as ActiveTab,
      label: 'Calendario e iCal',
      icon: CalendarDays,
      badge: activeBookingsCount > 0 ? activeBookingsCount : null,
      badgeBg: 'bg-[#D9D2F4] text-[#3B2A6B]'
    },
    {
      id: 'cleaning' as ActiveTab,
      label: 'Limpieza',
      icon: Sparkles,
      badge: pendingCleaningCount > 0 ? pendingCleaningCount : null,
      badgeBg: 'bg-[#D9E8D2] text-[#234E1D]'
    },
    {
      id: 'owners' as ActiveTab,
      label: 'Propietarios',
      icon: Users,
      badge: null
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reportes',
      icon: BarChart3,
      badge: null
    }
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full p-5">
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
            Navegación
          </span>
          {onCloseMobileMenu && (
            <button 
              onClick={onCloseMobileMenu}
              className="lg:hidden p-1 rounded-lg text-black/50 hover:bg-black/5"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#2D2D2D] shadow-sm border border-black/5 font-semibold'
                    : 'text-[#2D2D2D]/70 hover:opacity-100 hover:bg-white/50 transition-all'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2D2D2D]' : 'text-black/50'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-black/10 text-[#2D2D2D]' : item.badgeBg || 'bg-black/10 text-black/70'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Frosted Glass Pro Accent Card */}
      <div className="mt-8 p-4 bg-[#F4C7B8]/80 backdrop-blur-sm rounded-xl border border-black/5 text-xs space-y-1">
        <p className="text-[11px] uppercase font-bold tracking-wider text-[#2D2D2D]">Pro Plan</p>
        <p className="text-xs opacity-80 text-[#2D2D2D]">Rialto Residences Complex</p>
        <p className="text-[10px] text-black/60 pt-1 font-medium">
          Sincronizador iCal & Control de Limpieza Activos
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#F4F4F2]/80 backdrop-blur-md border-r border-black/5 flex-col justify-between shrink-0">
        {navContent}
      </aside>

      {/* Mobile & Tablet Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobileMenu}
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[80vw] bg-[#F4F4F2] shadow-2xl h-full z-10 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};


