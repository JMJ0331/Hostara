import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  Building2,
  Calendar
} from 'lucide-react';
import type { Property, Reservation, Owner } from '../types';

interface ReportsViewProps {
  properties: Property[];
  reservations: Reservation[];
  owners: Owner[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  properties,
  reservations,
  owners
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'july2026' | 'active'>('all');

  const filteredReservations = selectedPeriod === 'active'
    ? reservations.filter(r => r.status === 'active')
    : reservations;

  // Calculate overall metrics
  const totalGrossIncome = filteredReservations.reduce((sum, r) => sum + r.totalPaid, 0);
  const totalCleaningCosts = filteredReservations.reduce((sum, r) => sum + r.cleaningCost, 0);
  const netRevenueAfterCleaning = totalGrossIncome - totalCleaningCosts;
  const estimatedManagementCommission = netRevenueAfterCleaning * 0.15;
  const totalOwnerPayouts = netRevenueAfterCleaning - estimatedManagementCommission;

  // Build property report table
  const propertyReports = properties.map((prop) => {
    const propRes = filteredReservations.filter(r => r.propertyId === prop.id);
    const bookingsCount = propRes.length;
    
    // Count total nights
    const totalNights = propRes.reduce((sum, r) => {
      const dIn = new Date(r.checkIn);
      const dOut = new Date(r.checkOut);
      return sum + Math.max(1, Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24)));
    }, 0);

    const gross = propRes.reduce((sum, r) => sum + r.totalPaid, 0);
    const cleaning = propRes.reduce((sum, r) => sum + r.cleaningCost, 0);
    
    const owner = owners.find(o => o.id === prop.ownerId || o.name === prop.ownerName);
    const commissionRate = owner ? owner.commissionRate : 15;
    
    const managementFee = (gross - cleaning) * (commissionRate / 100);
    const ownerPayout = gross - cleaning - managementFee;

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      propertyGroup: prop.group,
      ownerName: prop.ownerName || owner?.name || 'Administración',
      bookingsCount,
      totalNights,
      gross,
      cleaning,
      managementFee,
      ownerPayout
    };
  });

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Propiedad,Complejo,Propietario,Reservas,Noches,Ingreso Bruto,Limpieza,Comisión SGR,Pago Neto\n";
    propertyReports.forEach((row) => {
      csvContent += `"${row.propertyName}","${row.propertyGroup}","${row.ownerName}",${row.bookingsCount},${row.totalNights},${row.gross},${row.cleaning},${row.managementFee.toFixed(2)},${row.ownerPayout.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Financiero_RentasMaster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] tracking-tight">
            Reportes Financieros y Estados de Cuenta
          </h1>
          <p className="text-xs text-black/50 mt-0.5">
            Liquidación de comisión de gestión, deducciones por limpieza y cálculo neto por propiedad.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="btn-secondary text-xs border-black/10"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary text-xs shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rm-card p-5">
          <span className="text-xs font-semibold text-black/50 uppercase">Ingresos Brutos Totales (USD)</span>
          <div className="text-2xl font-bold text-[#2D2D2D] mt-1">
            ${totalGrossIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </div>
          <span className="text-[11px] text-black/50">Antes de deducciones</span>
        </div>

        <div className="rm-card p-5">
          <span className="text-xs font-semibold text-black/50 uppercase">Gastos de Limpieza (USD)</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            -${totalCleaningCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </div>
          <span className="text-[11px] text-black/50">Costo operativo pagado</span>
        </div>

        <div className="rm-card p-5">
          <span className="text-xs font-semibold text-black/50 uppercase">Comisiones Gestor (USD)</span>
          <div className="text-2xl font-bold text-purple-800 mt-1">
            ${estimatedManagementCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </div>
          <span className="text-[11px] text-black/50">Ingreso por administración</span>
        </div>

        <div className="rm-card p-5 bg-[#FAFAF8] border-black/15">
          <span className="text-xs font-semibold text-black/50 uppercase">Pago Neto Propietarios (USD)</span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            ${totalOwnerPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Monto final a transferir</span>
        </div>
      </div>

      {/* Property Breakdown Table */}
      <div className="rm-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5">
          <div>
            <h3 className="font-bold text-base text-[#2D2D2D]">
              Estado de Cuenta por Propiedad
            </h3>
            <p className="text-xs text-black/50">
              Desglose detallado por unidad para informes a propietarios.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-black/50 hidden sm:inline">Periodo:</span>
            <select
              value={selectedPeriod}
              onChange={(e: any) => setSelectedPeriod(e.target.value)}
              className="bg-[#FAFAF8] border border-black/10 rounded-lg px-2.5 py-1 text-xs font-medium text-[#2D2D2D] hover:border-black/20 focus:outline-none focus:border-black/30 transition-all cursor-pointer truncate max-w-[150px] sm:max-w-none"
            >
              <option value="all">Todas las Reservas</option>
              <option value="active">Solo Reservas Activas</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-[11px] uppercase tracking-wider text-black/50 font-semibold bg-[#FAFAF8]">
                <th className="py-3 px-3">Propiedad</th>
                <th className="py-3 px-3">Complejo</th>
                <th className="py-3 px-3">Propietario</th>
                <th className="py-3 px-3 text-center">Reservas / Noches</th>
                <th className="py-3 px-3 text-right">Ingreso Bruto</th>
                <th className="py-3 px-3 text-right">Limpieza</th>
                <th className="py-3 px-3 text-right">Comisión SGR</th>
                <th className="py-3 px-3 text-right">Pago Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-xs">
              {propertyReports.map((row) => (
                <tr key={row.propertyId} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="py-3 px-3 font-bold text-[#2D2D2D]">
                    {row.propertyName}
                  </td>
                  <td className="py-3 px-3 text-black/60">
                    {row.propertyGroup}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#2D2D2D]">
                    {row.ownerName}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono text-[11px]">
                      {row.bookingsCount} res / {row.totalNights} noches
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[#2D2D2D]">
                    ${row.gross.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-600 font-medium">
                    -${row.cleaning.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-purple-700 font-medium">
                    -${row.managementFee.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-800 bg-emerald-50/50">
                    ${row.ownerPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Cards View */}
        <div className="lg:hidden divide-y divide-black/5">
          {propertyReports.map((row) => (
            <div key={row.propertyId} className="p-4 space-y-3 hover:bg-[#FAFAF8] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#2D2D2D]">{row.propertyName}</h4>
                  <p className="text-[11px] text-black/50">🏢 {row.propertyGroup}</p>
                </div>
                <span className="text-[11px] font-semibold text-black/60 bg-black/5 px-2 py-0.5 rounded-full">
                  {row.ownerName}
                </span>
              </div>

              <div className="text-xs text-black/60 bg-[#FAFAF8] p-2 rounded-lg border border-black/5 flex justify-between">
                <span>Ocupación:</span>
                <span className="font-mono font-bold text-[#2D2D2D]">
                  {row.bookingsCount} reservas ({row.totalNights} noches)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-black/40 uppercase font-semibold block">Ingreso Bruto</span>
                  <span className="font-bold text-[#2D2D2D]">${row.gross.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-black/40 uppercase font-semibold block">Gasto Limpieza</span>
                  <span className="font-medium text-rose-600">-${row.cleaning.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-black/40 uppercase font-semibold block">Comisión SGR</span>
                  <span className="font-medium text-purple-700">-${row.managementFee.toFixed(2)}</span>
                </div>
                <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Pago Neto Propietario</span>
                  <span className="font-bold text-emerald-800 text-sm">${row.ownerPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
