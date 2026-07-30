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
    const finalGroup = newGroupInput.trim() ? newGroupInput.trim() : group;
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/10 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-black/10">
          <h2 className="font-bold text-base text-[#2D2D2D]">Añadir Nueva Propiedad / Unidad</h2>
          <button onClick={onClose} className="p-1 text-black/40 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold mb-1">Nombre de la Unidad / Apartamento:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Apartamento 203 Sea View"
              className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Complejo / Grupo:</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs font-medium text-[#2D2D2D]"
              >
                {groups.map((g) => (
                  <option key={g} value={g}>
                    🏢 {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Nuevo Complejo (opcional):</label>
              <input
                type="text"
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                placeholder="Ej: Condos Oasis"
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Propietario:</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs font-medium text-[#2D2D2D]"
              >
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    👤 {o.name} ({o.commissionRate}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Plataforma Principal:</label>
              <select
                value={platformDefault}
                onChange={(e) => setPlatformDefault(e.target.value as Platform)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs font-medium text-[#2D2D2D]"
              >
                <option value="Airbnb">Airbnb</option>
                <option value="Booking">Booking.com</option>
                <option value="Direct">Directa</option>
                <option value="Vrbo">Vrbo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Costo de Limpieza ($ MXN):</label>
              <input
                type="number"
                required
                min="0"
                value={cleaningCost}
                onChange={(e) => setCleaningCost(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Tarifa por Noche Base ($):</label>
              <input
                type="number"
                required
                min="0"
                value={nightlyRateDefault}
                onChange={(e) => setNightlyRateDefault(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold mb-1">Habitaciones:</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 py-1.5 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Baños:</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 py-1.5 text-xs text-[#2D2D2D]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Capacidad:</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 py-1.5 text-xs text-[#2D2D2D]"
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
