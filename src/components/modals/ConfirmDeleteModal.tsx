import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  confirmText?: string;
  subtitle?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar eliminación",
  message = "¿Estás seguro de que deseas eliminar este elemento?",
  itemName,
  confirmText = "Sí, Eliminar",
  subtitle = "Esta acción no se puede deshacer"
}) => {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-black/10 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2D2D2D]">{title}</h3>
              <p className="text-xs text-black/50">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-black/40 hover:text-black rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#2D2D2D] leading-relaxed">
          {message}
          {itemName && (
            <strong className="block mt-1 font-semibold text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2">
              {itemName}
            </strong>
          )}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
