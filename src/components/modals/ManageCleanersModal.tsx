import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Phone, UserCheck } from 'lucide-react';
import { BroomIcon } from '../icons/BroomIcon';
import type { CleanerStaff } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ManageCleanersModalProps {
  isOpen: boolean;
  onClose: () => void;
  cleaners: CleanerStaff[];
  onAddCleaner: (cleanerData: Omit<CleanerStaff, 'id' | 'active'>) => void;
  onUpdateCleaner: (id: string, updatedData: Partial<CleanerStaff>) => void;
  onRequestDeleteCleaner: (id: string, name: string) => void;
}

export const ManageCleanersModal: React.FC<ManageCleanersModalProps> = ({
  isOpen,
  onClose,
  cleaners,
  onAddCleaner,
  onUpdateCleaner,
  onRequestDeleteCleaner
}) => {
  useScrollLock(isOpen);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCleaner({
      name: name.trim(),
      phone: phone.trim()
    });
    setName('');
    setPhone('');
  };

  const handleStartEdit = (cleaner: CleanerStaff) => {
    setEditingId(cleaner.id);
    setEditName(cleaner.name);
    setEditPhone(cleaner.phone || '');
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdateCleaner(id, {
        name: editName.trim(),
        phone: editPhone.trim()
      });
    }
    setEditingId(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-[#FFFFFF] rounded-2xl max-w-md w-full p-4 sm:p-6 border border-black/10 shadow-md space-y-4 max-h-[85vh] flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-black/10 gap-2">
          <div>
            <h2 className="font-bold text-sm sm:text-base text-[#2D2D2D] leading-snug">Gestionar Personal de Limpieza</h2>
            <p className="text-[11px] text-black/50 leading-tight">Administra el equipo de encargadas y sus contactos de WhatsApp</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-black/40 hover:text-black rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to Add New Cleaner Staff */}
        <form onSubmit={handleAdd} className="space-y-2 bg-[#FAFAF8] p-3 rounded-xl border border-black/5 text-xs">
          <span className="font-bold text-[#2D2D2D] text-xs block">Añadir Nuevo Personal:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input
              type="tel"
              value={phone}
              onKeyDown={(e) => {
                if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                if (!/[0-9+\s-]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s-]/g, ''))}
              placeholder="Teléfono / WhatsApp"
              className="bg-white border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn-primary text-xs px-3.5 py-2 disabled:opacity-50 flex items-center justify-center gap-1 shrink-0 w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>
        </form>

        {/* Cleaners List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-1">
          {cleaners.length === 0 ? (
            <p className="text-xs text-black/40 text-center py-6">No hay personal de limpieza registrado.</p>
          ) : (
            cleaners.map((cleaner) => (
              <div
                key={cleaner.id}
                className="p-3 bg-[#FAFAF8] rounded-xl border border-black/5 text-xs space-y-2"
              >
                {editingId === cleaner.id ? (
                  /* Editing Mode */
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-white border border-black/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2D2D2D]"
                        placeholder="Nombre"
                        autoFocus
                      />
                      <input
                        type="tel"
                        value={editPhone}
                        onKeyDown={(e) => {
                          if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                          if (!/[0-9+\s-]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9+\s-]/g, ''))}
                        className="bg-white border border-black/20 rounded-lg px-2.5 py-1.5 text-xs text-[#2D2D2D]"
                        placeholder="Teléfono"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cleaner.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                        title="Guardar cambios"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-gray-200 text-black/60 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal Item View */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="font-bold text-[#2D2D2D] text-xs break-words">{cleaner.name}</span>
                        {cleaner.phone && (
                          <span className="text-[11px] text-black/60 flex items-center gap-1 font-mono bg-black/5 px-1.5 py-0.5 rounded-md">
                            <Phone className="w-3 h-3 text-black/40 shrink-0" />
                            {cleaner.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-black/5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cleaner)}
                        className="p-1.5 text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                        title="Editar información"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDeleteCleaner(cleaner.id, cleaner.name)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar personal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-black/10 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-2 cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};


