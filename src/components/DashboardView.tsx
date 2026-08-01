import React from 'react';
import { 
  DollarSign, 
  CalendarCheck, 
  LogOut, 
  Sparkles, 
  Plus, 
  CalendarSync, 
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  Home,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import type { DashboardStats, Reservation, CleaningTask, Platform } from '../types';

interface DashboardViewProps {
  stats: DashboardStats;
  reservations: Reservation[];
  cleaningTasks: CleaningTask[];
  userName?: string;
  onOpenNewResModal: () => void;
  onOpenNewPropModal: () => void;
  onOpenNewCleaningModal: () => void;
  onOpenICalModal: () => void;
  onUpdateCleaningStatus: (id: string, status: CleaningTask['status']) => void;
  onSelectReservation: (res: Reservation) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  reservations,
  cleaningTasks,
  userName,
  onOpenNewResModal,
  onOpenNewPropModal,
  onOpenNewCleaningModal,
  onOpenICalModal,
  onUpdateCleaningStatus,
  onSelectReservation
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = userName || 'Hostara';

  const checkOutsTodayList = reservations.filter(
    (r) => r.checkOut === todayStr && r.status === 'active'
  );

  const pendingCleanings = cleaningTasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  );

  const getPlatformBadge = (platform: Platform) => {
    switch (platform) {
      case 'Airbnb':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Airbnb</span>;
      case 'Booking':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Booking.com</span>;
      case 'Vrbo':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Vrbo</span>;
      case 'Direct':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Directa</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Otra</span>;
    }
  };

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1 capitalize">{formattedDate}</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2D2D]">{getGreeting()}, {displayName}</h1>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Ingresos Netos (USD)</p>
            <p className="text-2xl font-bold text-[#2D2D2D]">
              ${stats.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </p>
          </div>
          <div className="mt-2 text-[10px] text-green-600 font-bold bg-green-50 w-fit px-2 py-0.5 rounded">
            Bruto: ${stats.totalRevenue.toLocaleString()} USD
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Reservas Activas</p>
            <p className="text-2xl font-bold text-[#2D2D2D]">{stats.activeBookings}</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">Ocupación: {stats.occupancyRatePercentage}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Check-outs Hoy</p>
            <p className="text-2xl font-bold text-[#2D2D2D]">
              {String(stats.checkOutsToday).padStart(2, '0')}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {checkOutsTodayList.length} pendientes de salida
          </p>
        </div>

        <div className="bg-[#D9E8D2] p-5 rounded-2xl border border-black/5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-black/40 uppercase tracking-widest mb-2">Limpiezas</p>
            <p className="text-2xl font-bold text-[#2D2D2D]">
              {String(stats.pendingCleaningCount).padStart(2, '0')}
            </p>
          </div>
          <p className="text-xs text-black/60 mt-2">Unidades requeridas</p>
        </div>
      </div>

      {/* Content Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        
        {/* Recent Reservations Table */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center">
            <h3 className="font-bold text-[#2D2D2D]">Reservas Recientes</h3>
            <button 
              onClick={onOpenNewResModal}
              className="text-xs font-semibold text-gray-400 hover:text-[#2D2D2D]"
            >
              + Añadir
            </button>
          </div>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAFAF8] text-[10px] uppercase tracking-wider text-gray-400 border-b border-black/5">
                <tr>
                  <th className="px-6 py-3 font-semibold">Huésped</th>
                  <th className="px-6 py-3 font-semibold">Propiedad</th>
                  <th className="px-6 py-3 font-semibold">Estadía</th>
                  <th className="px-6 py-3 font-semibold">Plataforma</th>
                  <th className="px-6 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-black/5">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-400">
                      No hay reservas activas.
                    </td>
                  </tr>
                ) : (
                  reservations.slice(0, 5).map((res) => (
                    <tr 
                      key={res.id} 
                      onClick={() => onSelectReservation(res)}
                      className="hover:bg-[#FAFAF8]/80 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-[#2D2D2D]">
                        {res.guestName}
                        {res.createdVia === 'ical' && (
                          <span className="ml-1 text-[10px] text-purple-600 font-normal">
                            (iCal)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 italic text-xs">
                        {res.propertyName}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                        {res.checkIn} → {res.checkOut}
                      </td>
                      <td className="px-6 py-4">
                        {getPlatformBadge(res.platform)}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#2D2D2D] text-right">
                        ${res.totalPaid.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden divide-y divide-black/5">
            {reservations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No hay reservas activas.
              </div>
            ) : (
              reservations.slice(0, 5).map((res) => (
                <div 
                  key={res.id} 
                  onClick={() => onSelectReservation(res)}
                  className="p-4 hover:bg-[#FAFAF8] cursor-pointer space-y-2 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#2D2D2D]">
                      {res.guestName}
                      {res.createdVia === 'ical' && (
                        <span className="ml-1 text-[10px] text-purple-600 font-normal">
                          (iCal)
                        </span>
                      )}
                    </span>
                    {getPlatformBadge(res.platform)}
                  </div>

                  <div className="text-xs text-gray-500">
                    🏢 <span className="font-semibold text-[#2D2D2D]">{res.propertyName}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-mono text-gray-600">
                      📅 {res.checkIn} → {res.checkOut}
                    </span>
                    <span className="font-bold text-[#2D2D2D] text-sm">
                      ${res.totalPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Side Tasks & Sync Status */}
        <section className="space-y-6">
          
          {/* Cleaning Tasks Card - Soft Lavender Theme */}
          <div className="bg-[#D9D2F4] p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold mb-0 flex items-center gap-2 text-[#2D2D2D]">
                <span className="w-2 h-2 rounded-full bg-[#2D2D2D]"></span>
                Tareas de Limpieza
              </h3>
              <button 
                onClick={onOpenNewCleaningModal}
                className="text-xs font-bold text-[#3B2A6B] hover:underline"
              >
                + Nueva
              </button>
            </div>

            <ul className="space-y-3">
              {cleaningTasks.length === 0 ? (
                <li className="bg-white/40 p-3 rounded-xl border border-white/40 text-xs text-black/60 text-center">
                  Sin tareas pendientes
                </li>
              ) : (
                cleaningTasks.slice(0, 3).map((task) => (
                  <li 
                    key={task.id}
                    className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                      task.status === 'completed' 
                        ? 'bg-white/80 border-white/40' 
                        : 'bg-white/40 border-white/40'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-[#2D2D2D]">{task.propertyName}</p>
                      <p className={`text-[10px] ${task.status === 'completed' ? 'text-green-700 font-bold' : 'opacity-70 text-[#2D2D2D]'}`}>
                        {task.status === 'completed' ? 'Finalizada' : `Encargada: ${task.assignedCleaner}`}
                      </p>
                    </div>

                    {task.status === 'completed' ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[11px] font-bold">✓</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onUpdateCleaningStatus(task.id, 'completed')}
                        className="text-[10px] font-bold px-2 py-1 bg-white/90 text-[#2D2D2D] rounded-lg shadow-xs hover:bg-white"
                      >
                        Completar
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Sync Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
            <h3 className="font-bold text-sm mb-4 text-[#2D2D2D]">Sync Status</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2D2D2D]">Airbnb & Booking iCal</p>
                <p className="text-[10px] text-gray-400">Última sinc: Automática</p>
              </div>
            </div>
            <button 
              onClick={onOpenICalModal}
              className="w-full py-2 bg.gray-50 border border-black/5 rounded-xl text-xs font-bold text-[#2D2D2D] hover:bg-gray-100 transition-all"
            >
              Sincronizar ahora
            </button>
          </div>

        </section>

      </div>

    </div>
  );
};

