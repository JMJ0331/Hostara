import React, { useState } from 'react';
import { X, Calendar, User, DollarSign, Building2, Phone, Mail } from 'lucide-react';
import type { Property, Platform, Reservation } from '../../types';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onCreateReservation: (resData: Partial<Reservation>) => void;
}

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  isOpen,
  onClose,
  properties,
  onCreateReservation
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const [propertyId, setPropertyId] = useState<string>(properties[0]?.id || '');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [platform, setPlatform] = useState<Platform>('Direct');
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [totalPaid, setTotalPaid] = useState<number>(360);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find(p => p.id === propertyId);
    
    onCreateReservation({
      propertyId,
      propertyName: prop?.name || 'Propiedad',
      propertyGroup: prop?.group || 'Individual',
      guestName: guestName || 'Huésped Directo',
      guestPhone,
      guestEmail,
      platform,
      checkIn,
      checkOut,
      totalPaid: Number(totalPaid) || 0,
      cleaningCost: prop?.cleaningCost || 40,
      notes,
      status: 'active'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 border border-black/10 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-black/10">
          <h2 className="font-bold text-base text-[#2D2D2D]">Crear Nueva Reserva</h2>
          <button onClick={onClose} className="p-1 text-black/40 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold mb-1">Propiedad:</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs font-medium text-[#2D2D2D]"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  🏢 {p.name} ({p.group}) — ${p.nightlyRateDefault}/noche
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Nombre del Huésped:</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ej: Sofia Martinez"
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Plataforma:</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs font-medium text-[#2D2D2D]"
              >
                <option value="Direct">Directa / Particular</option>
                <option value="Airbnb">Airbnb</option>
                <option value="Booking">Booking.com</option>
                <option value="Vrbo">Vrbo</option>
                <option value="Other">Otra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Check-in:</label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Check-out:</label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Monto Total Pagado ($ USD):</label>
              <input
                type="number"
                required
                min="0"
                value={totalPaid}
                onChange={(e) => setTotalPaid(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Teléfono Huésped:</label>
              <input
                type="text"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Notas adicionales:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Solicitó salida tarde, pago recibido en efectivo, etc."
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
              Guardar Reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
