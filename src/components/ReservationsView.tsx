import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  List, 
  CalendarSync, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Reservation, Platform, ReservationStatus } from '../types';

interface ReservationsViewProps {
  reservations: Reservation[];
  onOpenNewResModal: () => void;
  onOpenICalModal: () => void;
  onSelectReservation: (res: Reservation) => void;
  onDeleteReservation: (id: string, guestName?: string) => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  reservations,
  onOpenNewResModal,
  onOpenICalModal,
  onSelectReservation,
  onDeleteReservation
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filteredReservations = reservations.filter((r) => {
    const matchesPlatform = platformFilter === 'ALL' || r.platform === platformFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = searchFilter === '' || 
      r.guestName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.propertyName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.externalId && r.externalId.toLowerCase().includes(searchFilter.toLowerCase()));

    return matchesPlatform && matchesStatus && matchesSearch;
  });

  const getPlatformBadge = (platform: Platform) => {
    switch (platform) {
      case 'Airbnb':
        return <span className="status-badge bg-rose-100 text-rose-800 border border-rose-200">Airbnb</span>;
      case 'Booking':
        return <span className="status-badge bg-blue-100 text-blue-800 border border-blue-200">Booking.com</span>;
      case 'Vrbo':
        return <span className="status-badge bg-purple-100 text-purple-800 border border-purple-200">Vrbo</span>;
      case 'Direct':
        return <span className="status-badge bg-emerald-100 text-emerald-800 border border-emerald-200">Directa</span>;
      default:
        return <span className="status-badge bg-gray-100 text-gray-800">Otra</span>;
    }
  };

  // Monthly calendar dates for July 2026 (July 1st, 2026 is Wednesday = 3 empty offset cells for Sun, Mon, Tue)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const firstDayOffset = 3; // 3 empty spaces before July 1st (Sun, Mon, Tue)
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);
  const [calMobileMode, setCalMobileMode] = useState<'grid' | 'agenda'>('grid');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] tracking-tight">
            Gestión de Reservas e iCal
          </h1>
          <p className="text-xs text-black/50 mt-0.5">
            Sincronización automatizada por UID de iCal, asignación de precios y cálculo de neto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenICalModal}
            className="btn-secondary text-xs cursor-pointer"
          >
            <CalendarSync className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden sm:inline">Configurar</span> iCal
          </button>

          <button
            onClick={onOpenNewResModal}
            className="btn-primary text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rm-card p-3.5 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        
        {/* Search */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por huésped o UID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2D2D] placeholder:text-black/40 focus:outline-none focus:border-black/30 focus:bg-white"
          />
        </div>

        {/* Dropdown Filters & View Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto">
          
          {/* Filters Group (Icon + Selects) */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-black/60 font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5 text-black/50" />
              <span className="hidden sm:inline">Filtrar:</span>
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="flex-1 sm:flex-initial min-w-[120px] bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 py-2 text-xs font-medium text-[#2D2D2D] focus:outline-none focus:border-black/30 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Todas las plataformas</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Booking">Booking.com</option>
              <option value="Direct">Directa</option>
              <option value="Vrbo">Vrbo</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-initial min-w-[110px] bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 py-2 text-xs font-medium text-[#2D2D2D] focus:outline-none focus:border-black/30 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          {/* Toggle View Mode (List / Calendar) */}
          <div className="flex items-center justify-center border border-black/10 rounded-xl bg-[#FAFAF8] p-1 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white shadow-2xs text-[#2D2D2D] font-bold' 
                  : 'text-black/40 hover:text-black/70'
              }`}
              title="Vista de lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-white shadow-2xs text-[#2D2D2D] font-bold' 
                  : 'text-black/40 hover:text-black/70'
              }`}
              title="Vista de calendario"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        <div className="rm-card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10 text-[11px] uppercase tracking-wider text-black/50 font-semibold bg-[#FAFAF8]">
                  <th className="py-3 px-4">Huésped & Origen</th>
                  <th className="py-3 px-4">Propiedad</th>
                  <th className="py-3 px-4">Plataforma</th>
                  <th className="py-3 px-4">Fechas (In / Out)</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4 text-right">Limpieza</th>
                  <th className="py-3 px-4 text-right">Ingreso Neto</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-xs">
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-black/40">
                      No se encontraron reservas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((res) => (
                    <tr 
                      key={res.id} 
                      className="hover:bg-[#FAFAF8] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#2D2D2D]">{res.guestName}</div>
                        {res.externalId && (
                          <div className="text-[10px] text-purple-700 font-mono flex items-center gap-1 mt-0.5" title={res.externalId}>
                            <span>UID: {res.externalId.substring(0, 16)}...</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2D2D2D]">{res.propertyName}</div>
                        <div className="text-[10px] text-black/40">{res.propertyGroup}</div>
                      </td>

                      <td className="py-3 px-4">
                        {getPlatformBadge(res.platform)}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-black/80">
                        {res.checkIn} → {res.checkOut}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-[#2D2D2D]">
                        ${res.totalPaid.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right text-rose-600 font-medium">
                        -${res.cleaningCost}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-[#2D2D2D]">
                        ${res.netAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`status-badge ${
                          res.status === 'active' ? 'badge-active' :
                          res.status === 'completed' ? 'badge-cleaning' : 'badge-coral'
                        }`}>
                          {res.status === 'active' ? 'Activa' : res.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onSelectReservation(res)}
                            className="p-1.5 hover:bg-black/5 rounded-md text-black/60 hover:text-black cursor-pointer"
                            title="Editar reserva"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteReservation(res.id, res.guestName)}
                            className="p-1.5 hover:bg-rose-50 rounded-md text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="Eliminar reserva"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden divide-y divide-black/5">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12 text-black/40 text-xs p-4">
                No se encontraron reservas con los filtros seleccionados.
              </div>
            ) : (
              filteredReservations.map((res) => (
                <div key={res.id} className="p-4 space-y-3 hover:bg-[#FAFAF8] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#2D2D2D]">{res.guestName}</h4>
                      {res.externalId && (
                        <p className="text-[10px] text-purple-700 font-mono truncate max-w-[180px]">
                          UID: {res.externalId.substring(0, 16)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getPlatformBadge(res.platform)}
                      <span className={`status-badge text-[10px] ${
                        res.status === 'active' ? 'badge-active' :
                        res.status === 'completed' ? 'badge-cleaning' : 'badge-coral'
                      }`}>
                        {res.status === 'active' ? 'Activa' : res.status === 'completed' ? 'Completada' : 'Cancelada'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-black/70">
                    🏢 <span className="font-semibold text-[#2D2D2D]">{res.propertyName}</span>
                    <span className="text-black/40 ml-1">({res.propertyGroup})</span>
                  </div>

                  <div className="text-xs font-mono text-black/80 bg-[#FAFAF8] p-2.5 rounded-lg border border-black/5 flex justify-between items-center">
                    <span>Estadía:</span>
                    <span className="font-bold">{res.checkIn} → {res.checkOut}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-black/5">
                    <div>
                      <span className="text-[10px] text-black/40 uppercase font-semibold block">Total</span>
                      <span className="font-bold text-[#2D2D2D]">${res.totalPaid.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-black/40 uppercase font-semibold block">Limpieza</span>
                      <span className="font-medium text-rose-600">-${res.cleaningCost}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-black/40 uppercase font-semibold block">Neto</span>
                      <span className="font-bold text-emerald-700">${res.netAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => onSelectReservation(res)}
                      className="btn-secondary text-xs py-1.5 px-3 gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => onDeleteReservation(res.id, res.guestName)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs cursor-pointer"
                      title="Eliminar reserva"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Calendar Grid View */
        <div className="rm-card p-3 sm:p-5 space-y-4">
          
          {/* Header & Mobile Mode Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2D2D2D] shrink-0" />
              <h3 className="font-bold text-xs sm:text-sm text-[#2D2D2D]">
                Calendario de Ocupación — Julio 2026
              </h3>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <div className="flex items-center bg-[#FAFAF8] border border-black/10 rounded-lg p-0.5 sm:hidden text-[11px]">
                <button
                  onClick={() => setCalMobileMode('grid')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    calMobileMode === 'grid' ? 'bg-white shadow-2xs text-[#2D2D2D] font-bold' : 'text-black/50'
                  }`}
                >
                  Cuadrícula
                </button>
                <button
                  onClick={() => setCalMobileMode('agenda')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    calMobileMode === 'agenda' ? 'bg-white shadow-2xs text-[#2D2D2D] font-bold' : 'text-black/50'
                  }`}
                >
                  Agenda
                </button>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-black/60 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Airbnb</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Booking</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Directa</span>
              </div>
            </div>
          </div>

          {/* Agenda View for Mobile */}
          {calMobileMode === 'agenda' && (
            <div className="block sm:hidden space-y-3">
              <p className="text-[11px] text-black/50 font-medium">
                Días con ocupación y reservas activas en Julio 2026:
              </p>
              <div className="space-y-2.5">
                {daysInMonth.map((day) => {
                  const formattedDay = `2026-07-${String(day).padStart(2, '0')}`;
                  const dayReservations = filteredReservations.filter(
                    (r) => r.checkIn <= formattedDay && r.checkOut >= formattedDay
                  );

                  if (dayReservations.length === 0) return null;

                  return (
                    <div 
                      key={day}
                      className="p-3 bg-[#FAFAF8] rounded-xl border border-black/5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs border-b border-black/5 pb-1.5">
                        <span className="font-bold text-[#2D2D2D]">
                          📅 Día {day} de Julio
                        </span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {dayReservations.length} {dayReservations.length === 1 ? 'reserva' : 'reservas'}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-0.5">
                        {dayReservations.map((res) => (
                          <div
                            key={res.id}
                            onClick={() => onSelectReservation(res)}
                            className="p-2 rounded-lg bg-white border border-black/10 flex items-center justify-between cursor-pointer hover:border-black/30 transition-all text-xs"
                          >
                            <div>
                              <p className="font-bold text-[#2D2D2D]">{res.guestName}</p>
                              <p className="text-[10px] text-black/50">{res.propertyName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getPlatformBadge(res.platform)}
                              <span className="font-mono text-[10px] font-bold text-[#2D2D2D]">
                                ${res.totalPaid}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grid View (Responsive with Scroll Wrapper on Mobile) */}
          {(calMobileMode === 'grid' || true) && (
            <div className={calMobileMode === 'agenda' ? 'hidden sm:block' : 'block'}>
              
              {/* Swipe Hint on Mobile */}
              <div className="sm:hidden text-[10px] text-black/40 flex items-center justify-end gap-1 mb-1 font-medium">
                <span>↔ Desliza para ver todo el mes</span>
              </div>

              {/* Scroll Container for Mobile */}
              <div className="overflow-x-auto pb-2 -mx-1 px-1 touch-pan-x">
                <div className="min-w-[620px] sm:min-w-0 grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs">
                  
                  {/* Day Names Header */}
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                    <div key={day} className="font-bold text-black/50 py-1 uppercase text-[10px] bg-[#FAFAF8] rounded-md border border-black/5">
                      {day}
                    </div>
                  ))}

                  {/* Empty Offset Cells for Offset Days */}
                  {Array.from({ length: firstDayOffset }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="min-h-[70px] sm:min-h-[85px] bg-black/[0.02] rounded-xl border border-dashed border-black/5" />
                  ))}

                  {/* Calendar Days */}
                  {daysInMonth.map((day) => {
                    const formattedDay = `2026-07-${String(day).padStart(2, '0')}`;
                    const dayReservations = filteredReservations.filter(
                      (r) => r.checkIn <= formattedDay && r.checkOut >= formattedDay
                    );
                    const isSelected = selectedDayNum === day;

                    return (
                      <div 
                        key={day} 
                        onClick={() => setSelectedDayNum(day)}
                        className={`min-h-[72px] sm:min-h-[85px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-[#2D2D2D] bg-white border-transparent shadow-sm'
                            : dayReservations.length > 0 
                            ? 'bg-white border-black/15 shadow-2xs hover:border-black/30' 
                            : 'bg-[#FAFAF8] border-black/5 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-[#2D2D2D]">{day}</span>
                          {dayReservations.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                          )}
                        </div>
                        
                        <div className="space-y-1 my-1">
                          {dayReservations.map((res) => (
                            <div
                              key={res.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectReservation(res);
                              }}
                              className={`p-1 rounded text-[9px] font-semibold truncate cursor-pointer hover:opacity-90 leading-tight ${
                                res.platform === 'Airbnb' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                                res.platform === 'Booking' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                                'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}
                              title={`${res.guestName} - ${res.propertyName}`}
                            >
                              <span className="font-bold">{res.guestName.split(' ')[0]}</span>
                              <span className="hidden md:inline text-[8px] opacity-75 ml-0.5">({res.propertyName.substring(0, 6)})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Quick Inspector Panel */}
              {selectedDayNum !== null && (
                <div className="mt-4 p-3.5 bg-[#FAFAF8] border border-black/10 rounded-2xl animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#2D2D2D] text-white flex items-center justify-center font-bold shrink-0">
                      {selectedDayNum}
                    </div>
                    <div>
                      <p className="font-bold text-[#2D2D2D]">Detalles del {selectedDayNum} de Julio 2026</p>
                      <p className="text-[11px] text-black/50">
                        {filteredReservations.filter(r => r.checkIn <= `2026-07-${String(selectedDayNum).padStart(2, '0')}` && r.checkOut >= `2026-07-${String(selectedDayNum).padStart(2, '0')}`).length} reservas encontradas para esta fecha.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDayNum(null)}
                    className="text-[11px] font-bold text-black/50 hover:text-black self-end sm:self-auto cursor-pointer"
                  >
                    Cerrar detalle
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
