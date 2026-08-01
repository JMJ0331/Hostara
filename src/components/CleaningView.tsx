import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  MessageSquare, 
  Share2, 
  Phone, 
  Calendar,
  Building2,
  DollarSign,
  Send,
  Edit3,
  Trash2
} from 'lucide-react';
import type { CleaningTask, CleaningStatus, Property } from '../types';

interface CleaningViewProps {
  cleaningTasks: CleaningTask[];
  properties: Property[];
  onOpenNewCleaningModal: () => void;
  onUpdateCleaningStatus: (id: string, status: CleaningStatus, cleanerName?: string) => void;
  onDeleteCleaningTask: (id: string, propertyName?: string) => void;
}

export const CleaningView: React.FC<CleaningViewProps> = ({
  cleaningTasks,
  properties,
  onOpenNewCleaningModal,
  onUpdateCleaningStatus,
  onDeleteCleaningTask
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedTaskShareId, setCopiedTaskShareId] = useState<string | null>(null);

  const filteredTasks = statusFilter === 'ALL'
    ? cleaningTasks
    : cleaningTasks.filter(t => t.status === statusFilter);

  const getStatusBadge = (status: CleaningStatus) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge bg-rose-100 text-rose-900 border border-rose-200">Pendiente</span>;
      case 'in_progress':
        return <span className="status-badge bg-amber-100 text-amber-900 border border-amber-200">En Proceso</span>;
      case 'completed':
        return <span className="status-badge badge-cleaning font-bold">Completada</span>;
      case 'verified':
        return <span className="status-badge bg-emerald-200 text-emerald-950 font-bold">Verificada</span>;
    }
  };

  const handleShareWhatsApp = (task: CleaningTask) => {
    const prop = properties.find(p => p.id === task.propertyId);

    const message = `🧹 *ORDEN DE LIMPIEZA - RENTASMASTER* 🧹
━━━━━━━━━━━━━━━━━━━━
🏢 *Propiedad:* ${task.propertyName} (${task.propertyGroup})
📅 *Fecha:* ${task.scheduledDate}
📍 *Dirección:* ${prop?.address || 'Consultar con administración'}
🔑 *Acceso / Notas:* ${prop?.notes || task.notes || 'Cerradura inteligente'}
💰 *Pago de Limpieza:* $${task.cost} USD
👤 *Encargada:* ${task.assignedCleaner}

Favor de confirmar al terminar enviando foto de la unidad. ¡Gracias!`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = task.cleanerPhone 
      ? `https://wa.me/${task.cleanerPhone.replace(/[^0-9]/g, '')}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
    setCopiedTaskShareId(task.id);
    setTimeout(() => setCopiedTaskShareId(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] tracking-tight flex items-center gap-2">
            Control de Limpiezas y Operaciones
          </h1>
          <p className="text-xs text-black/50 mt-0.5">
            Asignación de personal de limpieza, envío de órdenes por WhatsApp y control de costos.
          </p>
        </div>

        <button
          onClick={onOpenNewCleaningModal}
          className="btn-primary text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Programar Limpieza</span>
        </button>
      </div>

      {/* Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-black/5">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            statusFilter === 'ALL'
              ? 'bg-[#2D2D2D] text-white shadow-xs font-semibold'
              : 'bg-white text-black/70 hover:bg-black/5 border border-black/10'
          }`}
        >
          Todas ({cleaningTasks.length})
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            statusFilter === 'pending'
              ? 'bg-[#2D2D2D] text-white shadow-xs font-semibold'
              : 'bg-white text-black/70 hover:bg-black/5 border border-black/10'
          }`}
        >
          🔴 Pendientes ({cleaningTasks.filter(t => t.status === 'pending').length})
        </button>

        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            statusFilter === 'in_progress'
              ? 'bg-[#2D2D2D] text-white shadow-xs font-semibold'
              : 'bg-white text-black/70 hover:bg-black/5 border border-black/10'
          }`}
        >
          🟡 En Proceso ({cleaningTasks.filter(t => t.status === 'in_progress').length})
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            statusFilter === 'completed'
              ? 'bg-[#2D2D2D] text-white shadow-xs font-semibold'
              : 'bg-white text-black/70 hover:bg-black/5 border border-black/10'
          }`}
        >
          🟢 Completadas ({cleaningTasks.filter(t => t.status === 'completed' || t.status === 'verified').length})
        </button>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full rm-card p-12 text-center text-black/40 text-xs">
            No hay tareas de limpieza en esta categoría.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className={`rm-card p-5 flex flex-col justify-between space-y-4 ${
                task.status === 'pending' ? 'border-l-4 border-l-rose-400' :
                task.status === 'in_progress' ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-emerald-500'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-base text-[#2D2D2D]">
                      {task.propertyName}
                    </h3>
                    <p className="text-[11px] text-black/50">
                      🏢 {task.propertyGroup}
                    </p>
                  </div>
                  {getStatusBadge(task.status)}
                </div>

                {/* Details */}
                <div className="mt-3 space-y-2 text-xs text-black/70 bg-[#FAFAF8] p-3 rounded-xl border border-black/5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-black/40" />
                    <span>Fecha: <strong>{task.scheduledDate}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-black/40" />
                    <span>Personal: <strong>{task.assignedCleaner}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                    <span>Costo Limpieza: <strong className="text-rose-700">${task.cost} USD</strong></span>
                  </div>

                  {task.notes && (
                    <div className="text-[11px] text-black/60 pt-1 border-t border-black/5">
                      📝 {task.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-black/5 space-y-2">
                
                {/* Status Toggle buttons */}
                <div className="flex items-center gap-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => onUpdateCleaningStatus(task.id, 'in_progress')}
                      className="btn-secondary text-[11px] py-1.5 px-3 flex-1 justify-center border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    >
                      <span>Iniciar Limpieza</span>
                    </button>
                  )}

                  {(task.status === 'pending' || task.status === 'in_progress') && (
                    <button
                      onClick={() => onUpdateCleaningStatus(task.id, 'completed')}
                      className="btn-secondary text-[11px] py-1.5 px-3 flex-1 justify-center border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Marcar Lista</span>
                    </button>
                  )}

                  {task.status === 'completed' && (
                    <button
                      onClick={() => onUpdateCleaningStatus(task.id, 'verified')}
                      className="btn-secondary text-[11px] py-1.5 px-3 flex-1 justify-center border-emerald-300 bg-emerald-100 text-emerald-950 font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Verificada</span>
                    </button>
                  )}
                </div>

                {/* WhatsApp Share Order Button */}
                <button
                  onClick={() => handleShareWhatsApp(task)}
                  className="btn-secondary text-[11px] w-full py-1.5 justify-center gap-1.5 border-emerald-300 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100"
                  title="Enviar orden de trabajo por WhatsApp a la camarera"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Compartir por WhatsApp</span>
                </button>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onDeleteCleaningTask(task.id, task.propertyName)}
                    className="text-[11px] text-rose-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                </div>

              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
