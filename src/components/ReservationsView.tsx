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
  ChevronRight,
  Sparkles,
  TrendingUp,
  Building2,
  User,
  X
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Calendar time frame filter: 'week' | 'month' | 'year'
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('month');
  
  // Week view reference date (defaults to Monday July 27, 2026)
  const [weekRefDate, setWeekRefDate] = useState<Date>(new Date(2026, 6, 27));

  // Month view reference date (defaults to current month/year)
  const [monthRefDate, setMonthRefDate] = useState<Date>(new Date());

  // Year view state
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Small popover/modal state when clicking a reservation pill
  const [smallModalRes, setSmallModalRes] = useState<Reservation | null>(null);

  // Helper to calculate Monday of a given week
  const getMondayOf = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.getFullYear(), date.getMonth(), diff);
  };

  const currentMonday = getMondayOf(weekRefDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + i);
    return d;
  });

  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const spanishDayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const spanishMonthShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const spanishMonthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Helper to get exact days in a month for a specific year
  const getDaysInMonth = (year: number, monthIndex: number) => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };

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
  const firstDayOffset = 3; // 3 empty spaces before July 1st
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
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rm-card p-3.5 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3.5 lg:gap-4">
        
        {/* Fila 1 en todos los dispositivos: Search Bar */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por huésped o UID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2D2D] placeholder:text-black/40 focus:outline-none focus:border-black/30 focus:bg-white transition-all"
          />
        </div>

        {/* Contenedor Fila 2 en Tablet (sm:) / 4 Filas en Móvil / En línea en Laptop (lg:) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 lg:gap-4 w-full lg:w-auto">
          
          {/* Hijo 1: Icono + Palabra 'Filtrar' (Fila 2 en móvil / Izquierda en Fila 2 de tablet) */}
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-black/60 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5 text-black/50" />
            <span>Filtrar:</span>
          </div>

          {/* Hijo 2: Contenedor con Dropdowns y Selector de Vistas (Filas 3, 4, 5 en móvil / Derecha en Fila 2 de tablet) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2.5 lg:gap-3 w-full sm:w-auto">
            {/* Fila 3 en móvil: Dropdown Plataforma */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[140px] bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 py-2 text-xs font-medium text-[#2D2D2D] focus:outline-none focus:border-black/30 focus:bg-white cursor-pointer transition-all truncate"
            >
              <option value="ALL">Todas las plataformas</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Booking">Booking.com</option>
              <option value="Direct">Directa</option>
              <option value="Vrbo">Vrbo</option>
            </select>

            {/* Fila 4 en móvil: Dropdown Estado */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[130px] bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 py-2 text-xs font-medium text-[#2D2D2D] focus:outline-none focus:border-black/30 focus:bg-white cursor-pointer transition-all truncate"
            >
              <option value="ALL">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            {/* Fila 5 en móvil: Estilador para las vistas (Lista / Calendario) */}
            <div className="flex items-center justify-center border border-black/10 rounded-xl bg-[#FAFAF8] p-1 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-initial p-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-2xs text-[#2D2D2D] font-bold' 
                    : 'text-black/40 hover:text-black/70'
                }`}
                title="Vista de lista"
              >
                <List className="w-4 h-4" />
                <span className="text-[11px] sm:hidden font-medium">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex-1 sm:flex-initial p-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  viewMode === 'calendar' 
                    ? 'bg-white shadow-2xs text-[#2D2D2D] font-bold' 
                    : 'text-black/40 hover:text-black/70'
                }`}
                title="Vista de calendario"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-[11px] sm:hidden font-medium">Calendario</span>
              </button>
            </div>
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
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-xs">
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-black/40">
                      No se encontraron reservas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#2D2D2D]">
                        <div>{res.guestName}</div>
                        {res.externalId && (
                          <div className="text-[10px] text-black/40 font-mono font-normal">
                            UID: {res.externalId}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2D2D2D]">{res.propertyName}</div>
                        <div className="text-[10px] text-black/40">{res.propertyGroup}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getPlatformBadge(res.platform)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-black/70">
                        {res.checkIn} → {res.checkOut}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#2D2D2D]">
                        ${res.totalPaid.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-600 font-medium">
                        -${res.cleaningCost}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        ${res.netAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`status-badge text-[10px] ${
                          res.status === 'active' ? 'badge-active' :
                          res.status === 'completed' ? 'badge-cleaning' : 'badge-coral'
                        }`}>
                          {res.status === 'active' ? 'Activa' : res.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => onSelectReservation(res)}
                          className="p-1.5 hover:bg-black/5 rounded-lg text-black/60 hover:text-black transition-colors cursor-pointer"
                          title="Editar Reserva"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReservation(res.id, res.guestName)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar Reserva"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block lg:hidden p-3.5 space-y-3">
            {filteredReservations.length === 0 ? (
              <div className="py-8 text-center text-xs text-black/40">
                No hay reservas para mostrar.
              </div>
            ) : (
              filteredReservations.map((res) => (
                <div key={res.id} className="p-3.5 bg-white border border-black/10 rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-[#2D2D2D]">{res.guestName}</h3>
                      {res.externalId && (
                        <p className="text-[10px] text-black/40 font-mono">
                          UID: {res.externalId}
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
        /* Calendar View with Week / Month / Year Filters */
        <div className="rm-card p-3 sm:p-5 space-y-4">
          
          {/* Calendar Controls & TimeFrame Selector Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-black/5">
            
            {/* Title & TimeFrame Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2D2D2D] shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm text-[#2D2D2D]">
                  Calendario de Ocupación
                </h3>
              </div>

              {/* Time Frame Selector: Semana | Mes | Año */}
              <div className="flex items-center bg-[#FAFAF8] border border-black/10 rounded-xl p-1 text-xs font-semibold">
                <button
                  onClick={() => setTimeFrame('week')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeFrame === 'week'
                      ? 'bg-[#2D2D2D] text-white shadow-2xs font-bold'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setTimeFrame('month')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeFrame === 'month'
                      ? 'bg-[#2D2D2D] text-white shadow-2xs font-bold'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setTimeFrame('year')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeFrame === 'year'
                      ? 'bg-[#2D2D2D] text-white shadow-2xs font-bold'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  Año
                </button>
              </div>
            </div>

            {/* Platform Legend & Mobile Mode Toggle */}
            <div className="flex items-center justify-between w-full md:w-auto gap-2">
              {timeFrame === 'month' && (
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
              )}

              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-black/60 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Airbnb</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Booking</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Directa</span>
              </div>
            </div>
          </div>

          {/* 1. WEEK VIEW */}
          {timeFrame === 'week' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between bg-[#FAFAF8] p-3 rounded-xl border border-black/5 text-xs gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prev = new Date(currentMonday);
                      prev.setDate(prev.getDate() - 7);
                      setWeekRefDate(prev);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 cursor-pointer"
                    title="Semana anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-[#2D2D2D] text-xs sm:text-sm">
                    Semana del {currentMonday.getDate()} de {spanishMonthNames[currentMonday.getMonth()]} al {weekDays[6].getDate()} de {spanishMonthNames[weekDays[6].getMonth()]} ({currentMonday.getFullYear()})
                  </span>

                  <button
                    onClick={() => {
                      const next = new Date(currentMonday);
                      next.setDate(next.getDate() + 7);
                      setWeekRefDate(next);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 cursor-pointer"
                    title="Siguiente semana"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setWeekRefDate(new Date(2026, 6, 27))}
                  className="btn-secondary text-[11px] py-1 px-3 cursor-pointer"
                >
                  Ver semana actual
                </button>
              </div>

              {/* 7 Days Grid (Lunes a Domingo) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {weekDays.map((d, index) => {
                  const formattedDay = formatDateISO(d);
                  const dayReservations = filteredReservations.filter(
                    (r) => r.checkIn <= formattedDay && r.checkOut >= formattedDay
                  );

                  return (
                    <div 
                      key={formattedDay}
                      className="p-3 bg-[#FAFAF8] rounded-2xl border border-black/10 flex flex-col justify-between space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-black/5 pb-1.5">
                        <div>
                          <span className="font-bold text-xs text-[#2D2D2D] block">
                            {spanishDayNames[index]}
                          </span>
                          <span className="text-[10px] text-black/50 font-medium">
                            {d.getDate()} {spanishMonthShort[d.getMonth()]}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {dayReservations.length} {dayReservations.length === 1 ? 'res.' : 'res.'}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 min-h-[90px]">
                        {dayReservations.length === 0 ? (
                          <div className="text-[10px] text-black/30 italic pt-2 text-center">Disponible</div>
                        ) : (
                          dayReservations.map((res) => (
                            <div
                              key={res.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSmallModalRes(res);
                              }}
                              className="bg-[#1E1E1E] text-white rounded-full p-2 px-3 shadow-md hover:bg-black transition-all cursor-pointer flex items-center justify-between gap-2 border border-white/10 group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-[#383838] border border-white/30 flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-2xs">
                                  {res.guestName ? res.guestName.charAt(0).toUpperCase() : 'H'}
                                </div>
                                <span className="font-semibold text-xs text-white truncate tracking-tight">
                                  {res.guestName}
                                </span>
                              </div>
                              <span className="text-[10px] text-white/60 font-mono font-medium shrink-0 group-hover:text-white transition-colors">
                                {res.platform}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. MONTH VIEW */}
          {timeFrame === 'month' && (() => {
            const currentMonthYear = monthRefDate.getFullYear();
            const currentMonthIdx = monthRefDate.getMonth();
            const daysInCurrentMonthCount = getDaysInMonth(currentMonthYear, currentMonthIdx);
            const daysInMonthList = Array.from({ length: daysInCurrentMonthCount }, (_, i) => i + 1);
            const firstDayOfMonthObj = new Date(currentMonthYear, currentMonthIdx, 1);
            const monthFirstDayOffset = firstDayOfMonthObj.getDay();

            return (
              <div className="space-y-4">
                
                {/* Month Navigation Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-[#FAFAF8] p-3 rounded-xl border border-black/5 text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const prev = new Date(currentMonthYear, currentMonthIdx - 1, 1);
                        setMonthRefDate(prev);
                      }}
                      className="p-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 cursor-pointer transition-colors"
                      title="Mes anterior"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#2D2D2D]" />
                    </button>

                    <span className="font-bold text-[#2D2D2D] text-xs sm:text-sm">
                      {spanishMonthNames[currentMonthIdx]} {currentMonthYear}
                    </span>

                    <button
                      onClick={() => {
                        const next = new Date(currentMonthYear, currentMonthIdx + 1, 1);
                        setMonthRefDate(next);
                      }}
                      className="p-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 cursor-pointer transition-colors"
                      title="Mes siguiente"
                    >
                      <ChevronRight className="w-4 h-4 text-[#2D2D2D]" />
                    </button>
                  </div>

                  <button
                    onClick={() => setMonthRefDate(new Date())}
                    className="btn-secondary text-[11px] py-1 px-3 cursor-pointer"
                  >
                    Ver Mes Actual
                  </button>
                </div>

                {/* Agenda View for Mobile */}
                {calMobileMode === 'agenda' && (
                  <div className="block sm:hidden space-y-3">
                    <p className="text-[11px] text-black/50 font-medium">
                      Días con ocupación en {spanishMonthNames[currentMonthIdx]} {currentMonthYear}:
                    </p>
                    <div className="space-y-2.5">
                      {daysInMonthList.map((day) => {
                        const formattedDay = `${currentMonthYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
                                📅 Día {day} de {spanishMonthNames[currentMonthIdx]}
                              </span>
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                {dayReservations.length} {dayReservations.length === 1 ? 'reserva' : 'reservas'}
                              </span>
                            </div>

                            <div className="space-y-1.5 pt-0.5">
                              {dayReservations.map((res) => (
                                <div
                                  key={res.id}
                                  onClick={() => setSmallModalRes(res)}
                                  className="bg-[#1E1E1E] text-white p-2.5 px-3 rounded-full flex items-center justify-between cursor-pointer hover:bg-black transition-all shadow-md border border-white/10"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-[#383838] border border-white/30 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                                      {res.guestName ? res.guestName.charAt(0).toUpperCase() : 'H'}
                                    </div>
                                    <p className="font-bold text-xs text-white truncate">{res.guestName}</p>
                                  </div>
                                  <span className="text-[10px] text-white/70 font-medium px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                                    {res.platform}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grid View */}
                {(calMobileMode === 'grid' || true) && (
                  <div className={calMobileMode === 'agenda' ? 'hidden sm:block' : 'block'}>
                    
                    {/* Swipe Hint on Mobile */}
                    <div className="sm:hidden text-[10px] text-black/40 flex items-center justify-end gap-1 mb-1 font-medium">
                      <span>↔ Desliza para ver todo el mes</span>
                    </div>

                    {/* Scroll Container for Mobile */}
                    <div className="overflow-x-auto pb-2 -mx-1 px-1 touch-pan-x">
                      <div className="min-w-[640px] sm:min-w-0 grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs">
                        
                        {/* Day Names Header */}
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                          <div key={day} className="font-bold text-black/50 py-1 uppercase text-[10px] bg-[#FAFAF8] rounded-md border border-black/5">
                            {day}
                          </div>
                        ))}

                        {/* Empty Offset Cells */}
                        {Array.from({ length: monthFirstDayOffset }).map((_, idx) => (
                          <div key={`offset-${idx}`} className="min-h-[75px] sm:min-h-[90px] bg-black/[0.02] rounded-xl border border-dashed border-black/5" />
                        ))}

                        {/* Calendar Days */}
                        {daysInMonthList.map((day) => {
                          const formattedDay = `${currentMonthYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dayOfWeek = new Date(currentMonthYear, currentMonthIdx, day).getDay();
                          
                          const dayReservations = filteredReservations.filter(
                            (r) => r.checkIn <= formattedDay && r.checkOut >= formattedDay
                          );
                          const isSelected = selectedDayNum === day;

                          return (
                            <div 
                              key={day} 
                              onClick={() => setSelectedDayNum(day)}
                              className={`min-h-[75px] sm:min-h-[90px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
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
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E1E1E]"></span>
                                )}
                              </div>
                              
                              <div className="space-y-1 my-1">
                                {dayReservations.map((res) => {
                                  const isCheckIn = formattedDay === res.checkIn;
                                  const isCheckOut = formattedDay === res.checkOut;
                                  const isRowStart = dayOfWeek === 0;

                                  return (
                                    <div
                                      key={res.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSmallModalRes(res);
                                      }}
                                      className={`py-1 px-1.5 text-[10px] font-semibold cursor-pointer hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs border border-white/10 bg-[#1E1E1E] text-white ${
                                        isCheckIn && isCheckOut
                                          ? 'rounded-full'
                                          : isCheckIn
                                          ? 'rounded-l-full rounded-r-xs'
                                          : isCheckOut
                                          ? 'rounded-r-full rounded-l-xs'
                                          : 'rounded-xs'
                                      }`}
                                      title={`${res.guestName} (${res.checkIn} a ${res.checkOut})`}
                                    >
                                      {(isCheckIn || isRowStart || dayReservations.length === 1) && (
                                        <div className="w-4 h-4 rounded-full bg-[#383838] border border-white/30 flex items-center justify-center font-bold text-[9px] text-white shrink-0 shadow-2xs">
                                          {res.guestName ? res.guestName.charAt(0).toUpperCase() : 'H'}
                                        </div>
                                      )}
                                      <span className="font-semibold text-[10px] text-white truncate tracking-tight">
                                        {res.guestName}
                                      </span>
                                    </div>
                                  );
                                })}
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
                            <p className="font-bold text-[#2D2D2D]">Detalles del {selectedDayNum} de {spanishMonthNames[currentMonthIdx]} {currentMonthYear}</p>
                            <p className="text-[11px] text-black/50">
                              {filteredReservations.filter(r => r.checkIn <= `${currentMonthYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(selectedDayNum).padStart(2, '0')}` && r.checkOut >= `${currentMonthYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(selectedDayNum).padStart(2, '0')}`).length} reservas encontradas para esta fecha.
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
            );
          })()}

          {/* 3. YEAR VIEW */}
          {timeFrame === 'year' && (
            <div className="space-y-4">
              {/* Year Selector Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-purple-50 rounded-xl border border-purple-100 text-purple-900 text-xs gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="font-semibold">Resumen Anual por Mes ({selectedYear})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium text-purple-900">Año:</span>
                  <div className="flex items-center bg-white border border-purple-200 rounded-xl p-0.5 shadow-2xs">
                    <button
                      onClick={() => setSelectedYear(prev => prev - 1)}
                      className="p-1 text-purple-900 hover:bg-purple-50 rounded-lg cursor-pointer"
                      title="Año anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-transparent font-bold text-xs text-purple-950 px-2 py-1 border-none focus:outline-none cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setSelectedYear(prev => prev + 1)}
                      className="p-1 text-purple-900 hover:bg-purple-50 rounded-lg cursor-pointer"
                      title="Siguiente año"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of 12 Months */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {spanishMonthNames.map((mName, monthIdx) => {
                  const daysInThisMonth = getDaysInMonth(selectedYear, monthIdx);
                  const monthPrefix = `${selectedYear}-${String(monthIdx + 1).padStart(2, '0')}`;
                  
                  const monthReservations = filteredReservations.filter((r) => {
                    const checkInMonth = r.checkIn.substring(0, 7);
                    const checkOutMonth = r.checkOut.substring(0, 7);
                    return checkInMonth === monthPrefix || checkOutMonth === monthPrefix;
                  });

                  const monthIncome = monthReservations.reduce((acc, r) => acc + r.totalPaid, 0);

                  return (
                    <div 
                      key={mName}
                      onClick={() => setTimeFrame('month')}
                      className="p-4 bg-[#FAFAF8] rounded-2xl border border-black/5 hover:border-black/20 hover:bg-white transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-black/5 pb-2">
                        <span className="font-bold text-sm text-[#2D2D2D]">{mName} {selectedYear}</span>
                        <span className="text-[10px] font-semibold bg-white border border-black/10 px-2 py-0.5 rounded-full text-black/60">
                          {daysInThisMonth} días
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-black/60">
                          <span>Reservas:</span>
                          <span className="font-bold text-[#2D2D2D]">{monthReservations.length}</span>
                        </div>
                        <div className="flex justify-between text-black/60">
                          <span>Ingresos:</span>
                          <span className="font-bold text-emerald-700">${monthIncome.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Small Airbnb-style Reservation Details Modal (Light Mode) */}
      {smallModalRes && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setSmallModalRes(null)}
        >
          <div 
            className="bg-white text-[#2D2D2D] rounded-2xl max-w-sm w-full p-4 sm:p-5 border border-black/10 shadow-2xl space-y-3.5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-sm text-purple-800 shrink-0 shadow-xs">
                  {smallModalRes.guestName ? smallModalRes.guestName.charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-[#2D2D2D] truncate leading-tight">
                    {smallModalRes.guestName}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-black/50 font-medium truncate">
                    Huésped {smallModalRes.createdVia === 'ical' ? 'vía iCal' : 'Manual'} ({smallModalRes.platform})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSmallModalRes(null)}
                className="p-1.5 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF8] border border-black/10">
                <span className="text-black/60 font-medium">Propiedad:</span>
                <span className="font-semibold text-[#2D2D2D] truncate max-w-[180px]">{smallModalRes.propertyName}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF8] border border-black/10">
                <span className="text-black/60 font-medium">Fechas:</span>
                <span className="font-bold text-[#2D2D2D] font-mono">
                  {smallModalRes.checkIn} → {smallModalRes.checkOut}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#FAFAF8] border border-black/10">
                  <span className="text-[10px] text-black/50 uppercase font-bold block">Total Reserva</span>
                  <span className="font-bold text-emerald-700 text-sm">${smallModalRes.totalPaid ? smallModalRes.totalPaid.toLocaleString() : '0'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAFAF8] border border-black/10">
                  <span className="text-[10px] text-black/50 uppercase font-bold block">Plataforma</span>
                  <span className="font-semibold text-[#2D2D2D]">{smallModalRes.platform}</span>
                </div>
              </div>

              {smallModalRes.externalId && (
                <div className="text-[10px] text-black/40 font-mono truncate pt-0.5">
                  UID iCal: {smallModalRes.externalId}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
              <button
                onClick={() => setSmallModalRes(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const r = smallModalRes;
                  setSmallModalRes(null);
                  onSelectReservation(r);
                }}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Editar Reserva
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
