import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  CalendarSync, 
  Edit3, 
  Trash2, 
  User, 
  DollarSign, 
  Bed, 
  Bath, 
  Users, 
  Link, 
  ExternalLink,
  CheckCircle,
  Copy
} from 'lucide-react';
import type { Property } from '../types';

interface PropertiesViewProps {
  properties: Property[];
  groups: string[];
  onOpenNewPropModal: () => void;
  onOpenManageGroupsModal: () => void;
  onEditProperty: (prop: Property) => void;
  onDeleteProperty: (id: string, name?: string) => void;
  onSyncPropertyICal: (propertyId: string) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  groups,
  onOpenNewPropModal,
  onOpenManageGroupsModal,
  onEditProperty,
  onDeleteProperty,
  onSyncPropertyICal
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredProperties = selectedGroupFilter === 'ALL'
    ? properties
    : properties.filter(p => p.group === selectedGroupFilter);

  // Group properties by complex
  const groupedProperties = filteredProperties.reduce((acc, prop) => {
    const groupName = prop.group || 'Sin Complejo';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(prop);
    return acc;
  }, {} as Record<string, Property[]>);

  const handleCopyICal = (prop: Property) => {
    const feedUrl = `${window.location.origin}/api/ical/sample/${prop.id}`;
    navigator.clipboard.writeText(feedUrl);
    setCopiedId(prop.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformBadgeClass = (platform: string) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('airbnb')) {
      return 'bg-[#FFF0F2] text-[#FF385C] border border-[#FFD0D6] font-bold';
    }
    if (p.includes('booking')) {
      return 'bg-[#EAF1FB] text-[#003580] border border-[#B8D1F5] font-bold';
    }
    if (p.includes('vrbo')) {
      return 'bg-[#EBF6FC] text-[#1174A6] border border-[#B5E0F7] font-bold';
    }
    if (p.includes('direct')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200 font-bold';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] tracking-tight">
            Propiedades y Complejos
          </h1>
          <p className="text-xs text-black/50 mt-0.5">
            Gestión de unidades, costos de limpieza fijos por propiedad y enlaces iCal.
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenManageGroupsModal}
            className="btn-secondary text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center whitespace-nowrap"
          >
            <Building2 className="w-4 h-4 text-[#2D2D2D] shrink-0" />
            <span>Gestionar Complejos</span>
          </button>
          <button
            onClick={onOpenNewPropModal}
            className="btn-primary text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Añadir Propiedad</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Complex */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-black/5">
        <button
          onClick={() => setSelectedGroupFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            selectedGroupFilter === 'ALL'
              ? 'bg-[#2D2D2D] text-white shadow-xs font-semibold'
              : 'bg-white text-black/70 hover:bg-black/5 border border-black/10'
          }`}
        >
          Todas las Unidades ({properties.length})
        </button>

        {groups.map((group) => {
          const count = properties.filter(p => p.group === group).length;
          return (
            <button
              key={group}
              onClick={() => setSelectedGroupFilter(group)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedGroupFilter === group
                  ? 'bg-[#2D2D2D] text-white shadow-xs font-semibold'
                  : 'bg-white text-black/70 hover:bg-black/5 border border-black/10'
              }`}
            >
              🏢 {group} ({count})
            </button>
          );
        })}
      </div>

      {/* Properties List Grouped by Complex */}
      {Object.keys(groupedProperties).length === 0 ? (
        <div className="rm-card p-12 text-center text-black/40 text-xs">
          No hay propiedades en este complejo. Haz clic en "+ Añadir Propiedad".
        </div>
      ) : (
        (Object.entries(groupedProperties) as [string, Property[]][]).map(([groupName, props]) => (
          <div key={groupName} className="space-y-4">
            
            <div className="flex items-center gap-2 border-b border-black/10 pb-2">
              <Building2 className="w-4 h-4 text-[#2D2D2D]" />
              <h2 className="font-bold text-base text-[#2D2D2D]">
                {groupName}
              </h2>
              <span className="text-xs bg-black/5 text-black/60 px-2 py-0.5 rounded-full font-medium">
                {props.length} unidad(es)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {props.map((prop) => (
                <div key={prop.id} className="rm-card p-5 flex flex-col justify-between space-y-4 w-full min-w-0 box-border">
                  
                  {/* Top Card Header */}
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2.5 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-[#2D2D2D] truncate" title={prop.name}>
                          {prop.name}
                        </h3>
                        <p className="text-[11px] text-black/50 truncate" title={prop.address || 'Zona Residencial Vacacional'}>
                          {prop.address || 'Zona Residencial Vacacional'}
                        </p>
                      </div>

                      <span className={`status-badge text-[10px] shrink-0 whitespace-nowrap ${getPlatformBadgeClass(prop.platformDefault)}`}>
                        {prop.platformDefault}
                      </span>
                    </div>

                    {/* Features list */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-black/60">
                      <div className="flex items-center gap-1 shrink-0">
                        <Bed className="w-3.5 h-3.5 text-black/40" />
                        <span>{prop.bedrooms || 1} habs</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Bath className="w-3.5 h-3.5 text-black/40" />
                        <span>{prop.bathrooms || 1} baños</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Users className="w-3.5 h-3.5 text-black/40" />
                        <span>Cap: {prop.capacity || 2}</span>
                      </div>
                    </div>

                    {/* Financial Specs */}
                    <div className="mt-4 p-3 bg-[#FAFAF8] rounded-xl border border-black/5 grid grid-cols-2 gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="text-[10px] text-black/40 uppercase font-semibold block truncate">Tarifa Noche</span>
                        <span className="font-bold text-[#2D2D2D] text-sm block truncate">${prop.nightlyRateDefault || 120} USD</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-black/40 uppercase font-semibold block truncate">Costo Limpieza</span>
                        <span className="font-bold text-rose-700 text-sm block truncate">${prop.cleaningCost} USD</span>
                      </div>
                    </div>

                    {/* Owner Info */}
                    {prop.ownerName && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-black/70 min-w-0">
                        <User className="w-3.5 h-3.5 text-black/40 shrink-0" />
                        <span className="truncate">Propietario: <strong>{prop.ownerName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Actions & iCal Buttons */}
                  <div className="pt-3 border-t border-black/5 space-y-2 min-w-0">
                    
                    {/* iCal Feed Buttons */}
                    <div className="flex flex-col xl:flex-row items-stretch gap-2 min-w-0">
                      <button
                        onClick={() => onSyncPropertyICal(prop.id)}
                        className="btn-secondary text-[11px] py-1.5 px-2.5 flex-1 justify-center gap-1 border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 min-w-0"
                        title="Probar sincronización iCal de esta propiedad"
                      >
                        <CalendarSync className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate">Sincronizar iCal</span>
                      </button>

                      <button
                        onClick={() => handleCopyICal(prop)}
                        className="btn-secondary text-[11px] py-1.5 px-2.5 justify-center gap-1 border-black/10 shrink-0"
                        title="Copiar enlace del feed iCal para Airbnb/Booking"
                      >
                        {copiedId === prop.id ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-emerald-700 whitespace-nowrap">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-black/50 shrink-0" />
                            <span className="whitespace-nowrap">Feed .ics</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => onEditProperty(prop)}
                        className="text-[#2D2D2D] hover:underline font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => onDeleteProperty(prop.id, prop.name)}
                        className="text-rose-600 hover:underline text-[11px] flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                  </div>

                </div>
              ))}
            </div>

          </div>
        ))
      )}

    </div>
  );
};
