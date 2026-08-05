import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BroomIcon } from '../icons/BroomIcon';
import type { Property, CleaningTask, CleanerStaff } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';

interface NewCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  cleaners?: CleanerStaff[];
  onCreateCleaningTask: (taskData: Partial<CleaningTask>) => void;
}

export const NewCleaningModal: React.FC<NewCleaningModalProps> = ({
  isOpen,
  onClose,
  properties,
  cleaners = [],
  onCreateCleaningTask
}) => {
  useScrollLock(isOpen);

  const todayStr = new Date().toISOString().split('T')[0];

  const [propertyId, setPropertyId] = useState<string>(properties[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState<string>(todayStr);
  const [assignedCleaner, setAssignedCleaner] = useState<string>('María Sánchez');
  const [cleanerPhone, setCleanerPhone] = useState<string>('+52 998 111 2233');
  const [cost, setCost] = useState<number | ''>(45);
  const [notes, setNotes] = useState<string>('Cambio de ropa de cama y sanitización de baños');

  if (!isOpen) return null;

  const handlePropertyChange = (pId: string) => {
    setPropertyId(pId);
    const selectedProp = properties.find(p => p.id === pId);
    if (selectedProp) {
      setCost(selectedProp.cleaningCost);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find(p => p.id === propertyId);

    onCreateCleaningTask({
      propertyId,
      propertyName: prop?.name || 'Propiedad',
      propertyGroup: prop?.group || 'Individual',
      scheduledDate,
      assignedCleaner: assignedCleaner || 'Por Asignar',
      cleanerPhone,
      cost: cost === '' ? (prop?.cleaningCost || 40) : Number(cost),
      status: 'pending',
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
        className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 border border-black/10 shadow-xl space-y-4 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/10">
          <div className="flex items-center gap-2">
            <BroomIcon className="w-4 h-4 text-emerald-700" />
            <h2 className="font-bold text-base text-[#2D2D2D]">Programar Orden de Limpieza</h2>
          </div>
          <button onClick={onClose} className="p-1 text-black/40 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="min-w-0">
              <label className="block font-semibold mb-1 truncate">Propiedad a Limpiar:</label>
              <select
                value={propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2D2D2D] hover:border-black/20 focus:outline-none focus:border-black/30 transition-all cursor-pointer shadow-2xs truncate"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏢 {p.name} ({p.group})
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block font-semibold mb-1 truncate">Fecha Programada:</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full min-w-0 max-w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-1.5 sm:px-3 py-2 text-xs text-[#2D2D2D] hover:border-black/20 focus:outline-none focus:border-black/30 transition-all appearance-none box-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="min-w-0">
              <label className="block font-semibold mb-1 truncate">Personal Limpieza:</label>
              {cleaners.length > 0 ? (
                <select
                  value={assignedCleaner}
                  onChange={(e) => {
                    const selName = e.target.value;
                    setAssignedCleaner(selName);
                    const found = cleaners.find(c => c.name === selName);
                    if (found && found.phone) {
                      setCleanerPhone(found.phone);
                    }
                  }}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-[#2D2D2D]"
                >
                  {cleaners.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Otro">Otro / Personal Externo</option>
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={assignedCleaner}
                  onChange={(e) => setAssignedCleaner(e.target.value)}
                  placeholder="Ej: Juana Perez"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                />
              )}
            </div>

            <div className="min-w-0">
              <label className="block font-semibold mb-1 truncate">WhatsApp:</label>
              <input
                type="tel"
                value={cleanerPhone}
                onKeyDown={(e) => {
                  if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                  if (!/[0-9+\s-]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setCleanerPhone(e.target.value.replace(/[^0-9+\s-]/g, ''))}
                placeholder="+52 998 111 2233"
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Costo de Limpieza ($ USD):</label>
            <input
              type="number"
              required
              min="0"
              value={cost}
              onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
              onChange={(e) => {
                const val = e.target.value;
                setCost(val === '' ? '' : Math.max(0, Number(val)));
              }}
              className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] font-bold text-rose-700"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Instrucciones / Notas:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Atención especial a la terraza y recambio de blancos"
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
              Crear Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
