import React, { useState } from 'react';
import { Users, Plus, Building2, CreditCard, Mail, Phone, DollarSign, Trash2, Edit2, X } from 'lucide-react';
import type { Owner, Property, Reservation } from '../types';

interface OwnersViewProps {
  owners: Owner[];
  properties: Property[];
  reservations: Reservation[];
  onAddOwner: (ownerData: Partial<Owner>) => void;
  onUpdateOwner?: (id: string, ownerData: Partial<Owner>) => void;
  onDeleteOwner: (id: string, name?: string) => void;
}

export const OwnersView: React.FC<OwnersViewProps> = ({
  owners,
  properties,
  reservations,
  onAddOwner,
  onUpdateOwner,
  onDeleteOwner
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'july2026' | 'all'>('current');

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState<number | ''>(15);
  const [payoutMethod, setPayoutMethod] = useState('Transferencia SPEI');
  const [accountNumber, setAccountNumber] = useState('');

  const openAddModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCommissionRate(15);
    setPayoutMethod('Transferencia SPEI');
    setAccountNumber('');
    setShowAddModal(true);
  };

  const openEditModal = (owner: Owner) => {
    setEditingOwner(owner);
    setName(owner.name);
    setEmail(owner.email || '');
    setPhone(owner.phone || '');
    setCommissionRate(owner.commissionRate || 15);
    setPayoutMethod(owner.payoutMethod || 'Transferencia SPEI');
    setAccountNumber(owner.accountNumber || '');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddOwner({
      name,
      email,
      phone,
      commissionRate: commissionRate === '' ? 15 : Number(commissionRate),
      payoutMethod,
      accountNumber
    });
    setShowAddModal(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOwner || !name.trim()) return;
    if (onUpdateOwner) {
      onUpdateOwner(editingOwner.id, {
        name,
        email,
        phone,
        commissionRate: commissionRate === '' ? 15 : Number(commissionRate),
        payoutMethod,
        accountNumber
      });
    }
    setEditingOwner(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] tracking-tight">
            Gestión de Propietarios y Liquidaciones
          </h1>
          <p className="text-xs text-black/50 mt-0.5">
            Cálculo transparente de ingresos brutos, deducción de limpieza y comisión de gestión.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-1.5">
            <span className="text-black/50 font-medium">Periodo:</span>
            <select
              value={selectedPeriod}
              onChange={(e: any) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-bold text-[#2D2D2D] focus:outline-none cursor-pointer"
            >
              <option value="current">Mes Actual (Agosto 2026)</option>
              <option value="july2026">Julio 2026</option>
              <option value="all">Todas las Reservas</option>
            </select>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary text-xs shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Propietario</span>
          </button>
        </div>
      </div>

      {/* Owners Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {owners.map((owner) => {
          const ownerProps = properties.filter(p => p.ownerId === owner.id || p.ownerName === owner.name);
          const propIds = ownerProps.map(p => p.id);

          const ownerReservations = reservations.filter(r => {
            if (!propIds.includes(r.propertyId)) return false;
            if (selectedPeriod === 'current') {
              return r.checkIn.startsWith('2026-08') || r.checkOut.startsWith('2026-08');
            }
            if (selectedPeriod === 'july2026') {
              return r.checkIn.startsWith('2026-07') || r.checkOut.startsWith('2026-07');
            }
            return true;
          });

          // Step-by-step formula calculation:
          // 1. Ingresos Brutos
          const grossIncome = ownerReservations.reduce((sum, r) => sum + r.totalPaid, 0);
          // 2. Gastos de Limpieza
          const cleaningCosts = ownerReservations.reduce((sum, r) => sum + r.cleaningCost, 0);
          // 3. Subtotal tras Limpieza
          const subtotalAfterCleaning = Math.max(0, grossIncome - cleaningCosts);
          // 4. Comisión de Gestión (porcentaje configurado)
          const managementFee = subtotalAfterCleaning * (owner.commissionRate / 100);
          // 5. Pago Neto al Propietario
          const netPayout = subtotalAfterCleaning - managementFee;

          return (
            <div key={owner.id} className="rm-card p-4 sm:p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                
                {/* Header Card Row: Name + Commission Badge + Action Buttons */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/5 pb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-[#2D2D2D] truncate">{owner.name}</h3>
                    <p className="text-[11px] text-black/50 truncate">{owner.email || 'Sin correo'}</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200 whitespace-nowrap shadow-2xs">
                      Comisión: {owner.commissionRate}%
                    </span>

                    <button
                      onClick={() => openEditModal(owner)}
                      className="p-1.5 text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                      title="Editar propietario"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteOwner(owner.id, owner.name)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar propietario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Owner Details */}
                <div className="space-y-2 text-xs text-black/70">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-black/40 shrink-0" />
                    <span className="truncate">{owner.phone || 'Sin teléfono'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-black/40 shrink-0" />
                    <span>Unidades administradas: <strong>{ownerProps.length}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-black/40 shrink-0" />
                    <span className="truncate">{owner.payoutMethod || 'SPEI'}: {owner.accountNumber || 'Configurado'}</span>
                  </div>
                </div>

                {/* Financial Summary Box (Step-by-step transparent formula) */}
                <div className="p-3 bg-[#FAFAF8] rounded-xl border border-black/10 text-xs space-y-2">
                  <div className="flex justify-between items-center text-black/70">
                    <span className="font-medium">1. Ingresos Brutos:</span>
                    <span className="font-bold text-[#2D2D2D]">${grossIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-black/70">
                    <span className="font-medium">2. (-) Costo Limpieza:</span>
                    <span className="font-semibold text-rose-600">-${cleaningCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-black/50 text-[11px] pt-1 border-t border-black/5">
                    <span>Subtotal tras Limpieza:</span>
                    <span className="font-semibold text-[#2D2D2D]">${subtotalAfterCleaning.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-black/70">
                    <span className="font-medium">3. (-) Comisión ({owner.commissionRate}%):</span>
                    <span className="font-semibold text-purple-700">-${managementFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-black/10 font-bold text-[#2D2D2D]">
                    <span className="text-xs">4. Pago Neto Propietario:</span>
                    <span className="text-emerald-700 text-sm font-bold">${netPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-black/5 text-[11px] text-black/50 truncate">
                Propiedades: {ownerProps.map(p => p.name).join(', ') || 'Ninguna asignada'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Owner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 border border-black/10 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h3 className="font-bold text-base text-[#2D2D2D]">Registrar Nuevo Propietario</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-black/40 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#2D2D2D] truncate">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                    placeholder="Ej: Alejandro Rialto"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2D2D2D] truncate">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                    placeholder="alejandro@ejemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#2D2D2D] truncate">Teléfono:</label>
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
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                    placeholder="+52 998 123 4567"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2D2D2D] truncate">Comisión (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCommissionRate(val === '' ? '' : Math.min(100, Math.max(0, Number(val))));
                    }}
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2D2D2D]">Cuenta de Liquidación (CLABE / Banco):</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
                  placeholder="CLABE 18 dígitos o email"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2 cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Owner Modal */}
      {editingOwner && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 border border-black/10 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h3 className="font-bold text-base text-[#2D2D2D]">Actualizar Propietario</h3>
              <button onClick={() => setEditingOwner(null)} className="p-1 rounded-lg text-black/40 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#2D2D2D] truncate">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2D2D2D] truncate">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#2D2D2D] truncate">Teléfono:</label>
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
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2D2D2D] truncate">Comisión (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCommissionRate(val === '' ? '' : Math.min(100, Math.max(0, Number(val))));
                    }}
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-[#2D2D2D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2D2D2D]">Cuenta de Liquidación (CLABE / Banco):</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingOwner(null)}
                  className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2 cursor-pointer"
                >
                  Actualizar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
