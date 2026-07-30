import React, { useState } from 'react';
import { Users, Plus, Building2, CreditCard, Mail, Phone, DollarSign } from 'lucide-react';
import type { Owner, Property, Reservation } from '../types';

interface OwnersViewProps {
  owners: Owner[];
  properties: Property[];
  reservations: Reservation[];
  onAddOwner: (ownerData: Partial<Owner>) => void;
}

export const OwnersView: React.FC<OwnersViewProps> = ({
  owners,
  properties,
  reservations,
  onAddOwner
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState(15);
  const [payoutMethod, setPayoutMethod] = useState('Transferencia SPEI');
  const [accountNumber, setAccountNumber] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddOwner({
      name,
      email,
      phone,
      commissionRate,
      payoutMethod,
      accountNumber
    });
    setName('');
    setEmail('');
    setPhone('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] tracking-tight">
            Gestión de Propietarios y Comisiones
          </h1>
          <p className="text-xs text-black/50 mt-0.5">
            Configuración de tarifas de administración, cuentas de liquidación y cartera de inmuebles.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Propietario</span>
        </button>
      </div>

      {/* Owners Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {owners.map((owner) => {
          const ownerProps = properties.filter(p => p.ownerId === owner.id || p.ownerName === owner.name);
          const propIds = ownerProps.map(p => p.id);
          const ownerReservations = reservations.filter(r => propIds.includes(r.propertyId));

          const grossIncome = ownerReservations.reduce((sum, r) => sum + r.totalPaid, 0);
          const cleaningCosts = ownerReservations.reduce((sum, r) => sum + r.cleaningCost, 0);
          const managementFee = (grossIncome - cleaningCosts) * (owner.commissionRate / 100);
          const netPayout = grossIncome - cleaningCosts - managementFee;

          return (
            <div key={owner.id} className="rm-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#2D2D2D]">{owner.name}</h3>
                  <p className="text-[11px] text-black/50">{owner.email || 'Sin correo'}</p>
                </div>
                <span className="status-badge badge-active">
                  Comisión: {owner.commissionRate}%
                </span>
              </div>

              <div className="space-y-2 text-xs text-black/70">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-black/40" />
                  <span>{owner.phone || 'Sin teléfono'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-black/40" />
                  <span>Unidades administradas: <strong>{ownerProps.length}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-black/40" />
                  <span>{owner.payoutMethod || 'SPEI'}: {owner.accountNumber || 'Configurado'}</span>
                </div>
              </div>

              {/* Financial Summary Box */}
              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-black/5 text-xs space-y-1.5">
                <div className="flex justify-between text-black/60">
                  <span>Ingresos Brutos:</span>
                  <span className="font-semibold text-[#2D2D2D]">${grossIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Comisión SGR ({owner.commissionRate}%):</span>
                  <span className="font-semibold text-purple-700">-${managementFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-black/5 font-bold text-[#2D2D2D]">
                  <span>A Pagar a Propietario:</span>
                  <span className="text-emerald-700 text-sm">${netPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-black/5 text-[11px] text-black/50">
                Propiedades: {ownerProps.map(p => p.name).join(', ') || 'Ninguna asignada'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-black/10 shadow-xl">
            <h3 className="font-bold text-base text-[#2D2D2D]">Registrar Nuevo Propietario</h3>
            
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
                  placeholder="Ej: Alejandro Rialto"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
                  placeholder="alejandro@ejemplo.com"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
                  placeholder="+52 998 123 4567"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Comisión de Administración (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Cuenta de Liquidación (CLABE):</label>
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
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
