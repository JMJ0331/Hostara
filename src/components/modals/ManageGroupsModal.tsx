import React, { useState } from 'react';
import { X, Building2, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ManageGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: string[];
  onAddGroup: (name: string) => void;
  onUpdateGroup: (oldName: string, newName: string) => void;
  onRequestDeleteGroup: (groupName: string) => void;
}

export const ManageGroupsModal: React.FC<ManageGroupsModalProps> = ({
  isOpen,
  onClose,
  groups,
  onAddGroup,
  onUpdateGroup,
  onRequestDeleteGroup
}) => {
  useScrollLock(isOpen);

  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onAddGroup(newGroupName.trim());
    setNewGroupName('');
  };

  const handleStartEdit = (group: string) => {
    setEditingGroup(group);
    setEditValue(group);
  };

  const handleSaveEdit = (oldName: string) => {
    if (editValue.trim() && editValue.trim() !== oldName) {
      onUpdateGroup(oldName, editValue.trim());
    }
    setEditingGroup(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 border border-black/10 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-black/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#2D2D2D] text-white rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#2D2D2D]">Gestionar Complejos</h2>
              <p className="text-[11px] text-black/50">Crea, renombrar o eliminar complejos vacacionales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-black/40 hover:text-black rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to add new complex */}
        <form onSubmit={handleAdd} className="flex gap-2 text-xs">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nombre del nuevo complejo..."
            className="flex-1 bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
          />
          <button
            type="submit"
            disabled={!newGroupName.trim()}
            className="btn-primary text-xs px-3.5 py-2 disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir</span>
          </button>
        </form>

        {/* List of complexes */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-1">
          {groups.length === 0 ? (
            <p className="text-xs text-black/40 text-center py-6">No hay complejos configurados.</p>
          ) : (
            groups.map((group) => (
              <div
                key={group}
                className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-xl border border-black/5 text-xs"
              >
                {editingGroup === group ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 bg-white border border-black/20 rounded-lg px-2.5 py-1.5 text-xs text-[#2D2D2D] font-medium"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(group)}
                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      title="Guardar cambios"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGroup(null)}
                      className="p-1.5 bg-gray-200 text-black/60 rounded-lg hover:bg-gray-300 transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-[#2D2D2D] truncate">🏢 {group}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(group)}
                        className="p-1.5 text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                        title="Renombrar complejo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDeleteGroup(group)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar complejo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-black/10 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
