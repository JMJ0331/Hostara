import React from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { 
  LayoutDashboard, 
  Home, 
  CalendarDays, 
  Users, 
  BarChart3,
  X,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import { BroomIcon } from './icons/BroomIcon';

export type ActiveTab = 'dashboard' | 'properties' | 'reservations' | 'cleaning' | 'owners' | 'reports';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCleaningCount: number;
  activeBookingsCount: number;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  onLogout?: () => void;
  onOpenAccountSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCleaningCount,
  activeBookingsCount,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
  userName,
  userEmail,
  avatarUrl,
  onLogout,
  onOpenAccountSettings
}) => {
  useScrollLock(isMobileMenuOpen);
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
      icon: Home,
      badge: null
    },
    {
      id: 'reservations' as ActiveTab,
      label: 'Calendario',
      icon: CalendarDays,
      badge: activeBookingsCount > 0 ? activeBookingsCount : null,
      badgeBg: 'bg-[#D9D2F4] text-[#3B2A6B]'
    },
    {
      id: 'cleaning' as ActiveTab,
      label: 'Limpiezas',
      icon: BroomIcon,
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

      {/* User Profile & Logout at bottom of sidebar */}
      {userEmail && (
        <div className="mt-auto pt-4 border-t border-black/10 space-y-2.5">
          <button
            onClick={onOpenAccountSettings}
            type="button"
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-xl border border-black/10 hover:border-black/20 transition-all group cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
            title="Abrir configuración de cuenta"
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-8 h-8 rounded-lg object-cover border border-black/10 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#2D2D2D] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                <User className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#2D2D2D] text-xs truncate group-hover:text-black">
                {userName || userEmail.split('@')[0]}
              </p>
              <p className="text-[10px] text-black/50 truncate group-hover:text-black/70">{userEmail}</p>
            </div>

            <Settings className="w-4 h-4 text-black/30 group-hover:text-black/70 group-hover:rotate-45 transition-all shrink-0" />
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      )}
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
          <aside className="relative w-72 max-w-[80vw] bg-[#F4F4F2] shadow-lg h-full z-10 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};


