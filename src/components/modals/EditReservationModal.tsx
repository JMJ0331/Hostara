import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar } from 'lucide-react';
import type { Reservation, Platform, ReservationStatus } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onUpdateReservation: (id: string, updatedData: Partial<Reservation>) => void;
}

export const EditReservationModal: React.FC<EditReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
  onUpdateReservation
}) => {
  useScrollLock(isOpen && !!reservation);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [platform, setPlatform] = useState<Platform>('Direct');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [totalPaid, setTotalPaid] = useState<number | ''>('');
  const [cleaningCost, setCleaningCost] = useState<number | ''>('');
  const [status, setStatus] = useState<ReservationStatus>('active');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (reservation) {
      setGuestName(reservation.guestName);
      setGuestPhone(reservation.guestPhone || '');
      setPlatform(reservation.platform);
      setCheckIn(reservation.checkIn);
      setCheckOut(reservation.checkOut);
      setTotalPaid(reservation.totalPaid);
      setCleaningCost(reservation.cleaningCost);
      setStatus(reservation.status);
      setNotes(reservation.notes || '');
    }
  }, [reservation]);

  if (!isOpen || !reservation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateReservation(reservation.id, {
      guestName,
      guestPhone,
      platform,
      checkIn,
      checkOut,
      totalPaid: totalPaid === '' ? 0 : Number(totalPaid),
      cleaningCost: cleaningCost === '' ? 0 : Number(cleaningCost),
      status,
      notes
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 border border-black/10 shadow-xl space-y-3.5 sm:space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/10">
          <div>
            <h2 className="font-bold text-base text-[#2D2D2D]">Editar Reserva / Asignar Precio</h2>
            <p className="text-[11px] text-black/50">
              Propiedad: <strong>{reservation.propertyName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-black/40 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold mb-1 truncate">Nombre Huésped:</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Plataforma:</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2D2D2D]"
              >
                <option value="Airbnb">Airbnb</option>
                <option value="Booking">Booking.com</option>
                <option value="Direct">Directa</option>
                <option value="Vrbo">Vrbo</option>
                <option value="Other">Otra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="min-w-0">
              <label className="block font-semibold mb-1 truncate">Check-in:</label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full min-w-0 max-w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-1.5 sm:px-3 py-2 text-xs text-[#2D2D2D] appearance-none box-border"
              />
            </div>

            <div className="min-w-0">
              <label className="block font-semibold mb-1 truncate">Check-out:</label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full min-w-0 max-w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-1.5 sm:px-3 py-2 text-xs text-[#2D2D2D] appearance-none box-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold mb-1 truncate">Monto Total ($ USD):</label>
              <input
                type="number"
                required
                min="0"
                value={totalPaid}
                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setTotalPaid(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-bold text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Costo Limpieza ($ USD):</label>
              <input
                type="number"
                required
                min="0"
                value={cleaningCost}
                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setCleaningCost(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-bold text-rose-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold mb-1 truncate">Estado Reserva:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReservationStatus)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2D2D2D]"
              >
                <option value="active">Activa</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Teléfono:</label>
              <input
                type="tel"
                value={guestPhone}
                onKeyDown={(e) => {
                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                  if (!/[0-9+\s-]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setGuestPhone(e.target.value.replace(/[^0-9+\s-]/g, ''))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>
          </div>

          {reservation.externalId && (
            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-[11px] text-purple-900 font-mono">
              UID iCal: {reservation.externalId}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1">Notas:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl p-2.5 text-xs text-[#2D2D2D]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary text-xs px-5 py-2 shadow-xs"
            >
              Actualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
