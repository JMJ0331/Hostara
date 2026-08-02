import React, { useState } from 'react';
import { 
  CalendarSync, 
  X, 
  Sparkles, 
  Copy, 
  CheckCircle, 
  Upload, 
  Link, 
  RefreshCw, 
  FileText, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import type { Property } from '../types';

interface ICalSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSyncProperty: (propertyId: string, icsContent?: string, url?: string) => Promise<any>;
  onSyncAll: () => Promise<any>;
  isSyncing: boolean;
}

export const ICalSyncModal: React.FC<ICalSyncModalProps> = ({
  isOpen,
  onClose,
  properties,
  onSyncProperty,
  onSyncAll,
  isSyncing
}) => {
  const [activeTab, setActiveTab] = useState<'sample' | 'custom' | 'raw' | 'export'>('sample');
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [rawIcsText, setRawIcsText] = useState<string>('');
  const [syncResult, setSyncResult] = useState<any>(null);
  const [copiedPropId, setCopiedPropId] = useState<string | null>(null);

  React.useEffect(() => {
    const selectedProp = properties.find(p => p.id === selectedPropId);
    if (selectedProp?.icalUrl) {
      setCustomUrl(selectedProp.icalUrl);
    } else {
      setCustomUrl('');
    }
  }, [selectedPropId, properties]);

  if (!isOpen) return null;

  const handleSyncSelected = async () => {
    setSyncResult(null);
    let res;
    if (activeTab === 'raw' && rawIcsText.trim()) {
      res = await onSyncProperty(selectedPropId, rawIcsText);
    } else if (activeTab === 'custom' && customUrl.trim()) {
      res = await onSyncProperty(selectedPropId, undefined, customUrl);
    } else {
      res = await onSyncProperty(selectedPropId);
    }
    setSyncResult(res);
  };

  const handleCopyExportUrl = (propId: string) => {
    const url = `${window.location.origin}/api/ical/sample/${propId}`;
    navigator.clipboard.writeText(url);
    setCopiedPropId(propId);
    setTimeout(() => setCopiedPropId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 selection:bg-[#2D2D2D] selection:text-white">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-black/10 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAFAF8] border-b border-black/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <CalendarSync className="w-5 h-5 text-purple-800" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-[#2D2D2D] truncate">
                Motor de Sincronización iCal
              </h2>
              <p className="text-[11px] sm:text-xs text-black/50 truncate">
                Sincroniza reservas de Airbnb, Booking.com y Vrbo evitando duplicados por UID.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 text-black/40 hover:text-black shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs horizontally scrollable for mobile */}
        <div className="flex items-center overflow-x-auto border-b border-black/5 px-3 sm:px-5 pt-2.5 bg-white gap-1 sm:gap-2 text-xs font-medium whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('sample')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'sample' 
                ? 'border-[#2D2D2D] text-[#2D2D2D] font-bold' 
                : 'border-transparent text-black/50 hover:text-black'
            }`}
          >
            🧪 Feeds de Prueba
          </button>
          
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'custom' 
                ? 'border-[#2D2D2D] text-[#2D2D2D] font-bold' 
                : 'border-transparent text-black/50 hover:text-black'
            }`}
          >
            🔗 Enlace iCal
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'raw' 
                ? 'border-[#2D2D2D] text-[#2D2D2D] font-bold' 
                : 'border-transparent text-black/50 hover:text-black'
            }`}
          >
            📄 Pegar Código .ics
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2 px-2.5 sm:px-3 border-b-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'export' 
                ? 'border-[#2D2D2D] text-[#2D2D2D] font-bold' 
                : 'border-transparent text-black/50 hover:text-black'
            }`}
          >
            📤 Exportar
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5 text-xs">
          
          {/* Target Property Picker */}
          {activeTab !== 'export' && (
            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1.5">
                Selecciona la Propiedad Destino:
              </label>
              <select
                value={selectedPropId}
                onChange={(e) => setSelectedPropId(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#2D2D2D] hover:border-black/20 focus:outline-none focus:border-black/30 focus:bg-white transition-all cursor-pointer shadow-2xs truncate"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏢 {p.name} ({p.group}) — {p.platformDefault}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TAB 1: Sample Feeds */}
          {activeTab === 'sample' && (
            <div className="space-y-4">
              <div className="p-3.5 sm:p-4 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                  Prueba iCal interactiva
                </p>
                <p className="text-[11px] text-purple-800">
                  El sistema generará un calendario iCal estándar con eventos VEVENT (incluyendo reservas activas y check-out para el día de hoy) para demostrar la creación automática de reservas y tareas de limpieza.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={handleSyncSelected}
                  disabled={isSyncing}
                  className="btn-primary flex-1 justify-center py-2.5 text-xs shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Procesando iCal...' : 'Probar Sincronización en esta Propiedad'}</span>
                </button>

                <button
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="btn-secondary py-2.5 text-xs border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 cursor-pointer justify-center"
                >
                  <span>Sincronizar Todas</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Custom URL */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-[#2D2D2D] mb-1.5">
                  URL del feed iCal (Airbnb / Booking / Vrbo):
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://www.airbnb.com/calendar/ical/123456.ics?s=abcdef"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <button
                onClick={handleSyncSelected}
                disabled={isSyncing || !customUrl.trim()}
                className="btn-primary w-full justify-center py-2.5 text-xs shadow-xs cursor-pointer"
              >
                <span>Descargar y Procesar iCal URL</span>
              </button>
            </div>
          )}

          {/* TAB 3: Raw ICS */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-[#2D2D2D] mb-1.5">
                  Pega el texto del archivo .ics:
                </label>
                <textarea
                  rows={5}
                  placeholder={`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:sample-uid-123\nDTSTART;VALUE=DATE:20260730\nDTEND;VALUE=DATE:20260802\nSUMMARY:Airbnb (HM12345) - Juan Perez\nEND:VEVENT\nEND:VCALENDAR`}
                  value={rawIcsText}
                  onChange={(e) => setRawIcsText(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl p-3 text-xs font-mono text-[#2D2D2D] focus:outline-none focus:border-black/30"
                />
              </div>

              <button
                onClick={handleSyncSelected}
                disabled={isSyncing || !rawIcsText.trim()}
                className="btn-primary w-full justify-center py-2.5 text-xs shadow-xs cursor-pointer"
              >
                <span>Parsear y Crear Reservas</span>
              </button>
            </div>
          )}

          {/* TAB 4: Export Feeds */}
          {activeTab === 'export' && (
            <div className="space-y-3">
              <p className="text-black/60 leading-relaxed">
                Copia estos enlaces para sincronizar la disponibilidad de Hostara hacia tus cuentas de Airbnb, Booking o Vrbo:
              </p>

              <div className="space-y-2">
                {properties.map((p) => (
                  <div key={p.id} className="p-3 bg-[#FAFAF8] rounded-xl border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-[#2D2D2D] truncate">{p.name}</div>
                      <div className="text-[10px] text-black/50 font-mono truncate">
                        /api/ical/sample/{p.id}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyExportUrl(p.id)}
                      className="btn-secondary text-[11px] py-1 px-3 gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      {copiedPropId === p.id ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-black/50" />
                          <span>Copiar URL</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Result Log Banner */}
          {syncResult && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sincronización Completada con Éxito</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                {syncResult.log?.message || `Se crearon ${syncResult.createdCount || 0} reservas nuevas.`}
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#FAFAF8] border-t border-black/10 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-5 py-2 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
