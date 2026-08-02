import React, { useState, useEffect } from 'react';
import { X, CalendarSync } from 'lucide-react';
import type { Owner, Platform, Property } from '../../types';

interface NewPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  owners: Owner[];
  groups: string[];
  propertyToEdit?: Property | null;
  onCreateProperty: (propData: Partial<Property>) => void;
  onUpdateProperty?: (id: string, propData: Partial<Property>) => void;
  onSyncPropertyICal?: (propertyId: string, icsContent?: string, url?: string) => void;
}

export const NewPropertyModal: React.FC<NewPropertyModalProps> = ({
  isOpen,
  onClose,
  owners,
  groups,
  propertyToEdit,
  onCreateProperty,
  onUpdateProperty,
  onSyncPropertyICal
}) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState(groups[0] || 'Rialto Residences');
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [ownerId, setOwnerId] = useState(owners[0]?.id || '');
  const [cleaningCost, setCleaningCost] = useState<number | ''>(45);
  const [nightlyRateDefault, setNightlyRateDefault] = useState<number | ''>(130);
  const [bedrooms, setBedrooms] = useState<number | ''>(2);
  const [bathrooms, setBathrooms] = useState<number | ''>(2);
  const [capacity, setCapacity] = useState<number | ''>(4);
  const [platformDefault, setPlatformDefault] = useState<Platform>('Airbnb');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [icalUrl, setIcalUrl] = useState('');

  useEffect(() => {
    if (propertyToEdit) {
      setName(propertyToEdit.name || '');
      setGroup(propertyToEdit.group || groups[0] || 'Rialto Residences');
      setOwnerId(propertyToEdit.ownerId || owners[0]?.id || '');
      setCleaningCost(propertyToEdit.cleaningCost ?? 45);
      setNightlyRateDefault(propertyToEdit.nightlyRateDefault ?? 130);
      setBedrooms(propertyToEdit.bedrooms ?? 2);
      setBathrooms(propertyToEdit.bathrooms ?? 2);
      setCapacity(propertyToEdit.capacity ?? 4);
      setPlatformDefault(propertyToEdit.platformDefault || 'Airbnb');
      setAddress(propertyToEdit.address || '');
      setNotes(propertyToEdit.notes || '');
      setIcalUrl(propertyToEdit.icalUrl || '');
    } else {
      setName('');
      setGroup(groups[0] || 'Rialto Residences');
      setIsNewGroup(false);
      setNewGroupInput('');
      setOwnerId(owners[0]?.id || '');
      setCleaningCost(45);
      setNightlyRateDefault(130);
      setBedrooms(2);
      setBathrooms(2);
      setCapacity(4);
      setPlatformDefault('Airbnb');
      setAddress('');
      setNotes('');
      setIcalUrl('');
    }
  }, [propertyToEdit, isOpen, groups, owners]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGroup = isNewGroup ? (newGroupInput.trim() || 'Nuevo Complejo') : group;
    const selectedOwner = owners.find(o => o.id === ownerId);

    const payload: Partial<Property> = {
      name,
      group: finalGroup,
      ownerId,
      ownerName: selectedOwner?.name,
      ownerEmail: selectedOwner?.email,
      ownerPhone: selectedOwner?.phone,
      cleaningCost: cleaningCost === '' ? 0 : Number(cleaningCost),
      nightlyRateDefault: nightlyRateDefault === '' ? 100 : Number(nightlyRateDefault),
      bedrooms: bedrooms === '' ? 1 : Number(bedrooms),
      bathrooms: bathrooms === '' ? 1 : Number(bathrooms),
      capacity: capacity === '' ? 2 : Number(capacity),
      platformDefault,
      address,
      notes,
      icalUrl,
      active: true
    };

    if (propertyToEdit && onUpdateProperty) {
      onUpdateProperty(propertyToEdit.id, payload);
      if (icalUrl && onSyncPropertyICal) {
        onSyncPropertyICal(propertyToEdit.id, undefined, icalUrl);
      }
    } else {
      onCreateProperty(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 border border-black/10 shadow-xl space-y-3.5 sm:space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-black/10">
          <h2 className="font-bold text-base text-[#2D2D2D]">
            {propertyToEdit ? 'Editar Propiedad / Unidad' : 'Añadir Nueva Propiedad / Unidad'}
          </h2>
          <button onClick={onClose} className="p-1 text-black/40 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <div className="flex items-center h-6 mb-1">
                <label className="font-semibold text-xs truncate">Nombre de Unidad:</label>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Apto 203 Sea View"
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between h-6 mb-1 gap-1">
                <label className="font-semibold text-xs truncate">Complejo / Grupo:</label>
                <label className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-purple-800 cursor-pointer select-none bg-purple-50 px-1.5 py-0.5 rounded-lg border border-purple-100 shrink-0">
                  <input
                    type="checkbox"
                    checked={isNewGroup}
                    onChange={(e) => setIsNewGroup(e.target.checked)}
                    className="rounded border-black/20 text-[#2D2D2D] focus:ring-0"
                  />
                  <span>+ Nuevo</span>
                </label>
              </div>

              {!isNewGroup ? (
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2D2D2D] hover:border-black/20 focus:outline-none focus:border-black/30 transition-all cursor-pointer shadow-2xs truncate"
                >
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      🏢 {g}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={newGroupInput}
                  onChange={(e) => setNewGroupInput(e.target.value)}
                  placeholder="Nuevo complejo..."
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2D2D2D]"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold mb-1 truncate">Propietario:</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2D2D2D] hover:border-black/20 focus:outline-none focus:border-black/30 transition-all cursor-pointer shadow-2xs truncate"
              >
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    👤 {o.name} ({o.commissionRate}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Plataforma Base:</label>
              <select
                value={platformDefault}
                onChange={(e) => setPlatformDefault(e.target.value as Platform)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2D2D2D] hover:border-black/20 focus:outline-none focus:border-black/30 transition-all cursor-pointer shadow-2xs truncate"
              >
                <option value="Airbnb">Airbnb</option>
                <option value="Booking">Booking.com</option>
                <option value="Direct">Directa</option>
                <option value="Vrbo">Vrbo</option>
              </select>
            </div>
          </div>

          {/* iCal Link Field */}
          <div>
            <label className="block font-semibold mb-1 text-purple-900 flex items-center gap-1.5">
              <CalendarSync className="w-3.5 h-3.5 text-purple-700" />
              <span>Enlace al calendario Airbnb (iCal):</span>
            </label>
            <input
              type="url"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/123456.ics?s=abcdef"
              className="w-full bg-purple-50/50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] focus:ring-2 focus:ring-purple-300 focus:outline-none"
            />
            <p className="text-[10px] text-black/50 mt-1">
              Al guardar con este enlace, se importarán automáticamente todas las reservas desde hoy en adelante.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
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
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D] font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Tarifa / Noche ($ USD):</label>
              <input
                type="number"
                required
                min="0"
                value={nightlyRateDefault}
                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setNightlyRateDefault(val === '' ? '' : Math.max(0, Number(val)));
                }}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <div>
              <label className="block font-semibold mb-1 truncate">Habitac.:</label>
              <input
                type="number"
                min="1"
                value={bedrooms}
                onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setBedrooms(val === '' ? '' : Math.max(1, Math.floor(Number(val))));
                }}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2 py-1.5 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Baños:</label>
              <input
                type="number"
                min="1"
                value={bathrooms}
                onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setBathrooms(val === '' ? '' : Math.max(1, Math.floor(Number(val))));
                }}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2 py-1.5 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Capacidad:</label>
              <input
                type="number"
                min="1"
                value={capacity}
                onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setCapacity(val === '' ? '' : Math.max(1, Math.floor(Number(val))));
                }}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2 py-1.5 text-xs text-[#2D2D2D]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Dirección Completa:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Kukulkan Km 12.5, Zona Hotelera"
              className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Notas / Cerradura Inteligente:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Código cerradura 8921, estacionamiento cajón 14"
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
              {propertyToEdit ? 'Guardar Cambios' : 'Guardar Propiedad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
