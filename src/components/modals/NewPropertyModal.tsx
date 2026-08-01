import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Owner, Platform, Property } from '../../types';

interface NewPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  owners: Owner[];
  groups: string[];
  onCreateProperty: (propData: Partial<Property>) => void;
}

export const NewPropertyModal: React.FC<NewPropertyModalProps> = ({
  isOpen,
  onClose,
  owners,
  groups,
  onCreateProperty
}) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState(groups[0] || 'Rialto Residences');
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [ownerId, setOwnerId] = useState(owners[0]?.id || '');
  const [cleaningCost, setCleaningCost] = useState(45);
  const [nightlyRateDefault, setNightlyRateDefault] = useState(130);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [capacity, setCapacity] = useState(4);
  const [platformDefault, setPlatformDefault] = useState<Platform>('Airbnb');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGroup = isNewGroup ? (newGroupInput.trim() || 'Nuevo Complejo') : group;
    const selectedOwner = owners.find(o => o.id === ownerId);

    onCreateProperty({
      name,
      group: finalGroup,
      ownerId,
      ownerName: selectedOwner?.name,
      ownerEmail: selectedOwner?.email,
      ownerPhone: selectedOwner?.phone,
      cleaningCost: Number(cleaningCost) || 0,
      nightlyRateDefault: Number(nightlyRateDefault) || 100,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      capacity: Number(capacity) || 2,
      platformDefault,
      address,
      notes,
      active: true
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 border border-black/10 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-black/10">
          <h2 className="font-bold text-base text-[#2D2D2D]">Añadir Nueva Propiedad / Unidad</h2>
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

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block font-semibold mb-1 truncate">Costo Limpieza ($):</label>
              <input
                type="number"
                required
                min="0"
                value={cleaningCost}
                onChange={(e) => setCleaningCost(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D] font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Tarifa / Noche ($):</label>
              <input
                type="number"
                required
                min="0"
                value={nightlyRateDefault}
                onChange={(e) => setNightlyRateDefault(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <div>
              <label className="block font-semibold mb-1 truncate">Habitac.:</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2 py-1.5 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Baños:</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2 py-1.5 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 truncate">Capacidad:</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
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
              Guardar Propiedad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
