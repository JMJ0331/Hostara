import React, { useState } from 'react';
import { Building2, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { createOrganizationRPC } from '../services/authService';

interface OnboardingViewProps {
  userName?: string;
  userEmail: string;
  onOrganizationCreated: (org: { organizationId: string; organizationName: string; organizationSlug: string }) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  userName,
  userEmail,
  onOrganizationCreated
}) => {
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orgName.trim()) {
      setError('Ingresa el nombre de tu organización o empresa.');
      return;
    }

    const slug = orgName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setIsLoading(true);

    try {
      const created = await createOrganizationRPC({
        name: orgName.trim(),
        slug: slug || `org-${Date.now()}`,
        fullName: userName
      });

      onOrganizationCreated({
        organizationId: created.id,
        organizationName: created.name,
        organizationSlug: created.slug
      });
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Error al crear la organización. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 selection:bg-[#2D2D2D] selection:text-white">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6 sm:p-10 space-y-6 relative overflow-hidden">
        
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2D2D2D] via-gray-700 to-[#2D2D2D]" />

        <div className="text-center space-y-3 pt-2">
          <div className="w-16 h-16 bg-[#2D2D2D] rounded-2xl flex items-center justify-center shadow-md mx-auto text-white">
            <Building2 className="w-9 h-9" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2D2D2D]/5 rounded-full text-xs font-semibold text-[#2D2D2D] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Configuración Inicial de Hostara</span>
            </div>
            <h1 className="font-bold text-2xl tracking-tight text-[#2D2D2D]">
              ¡Bienvenido{userName ? `, ${userName}` : ''}!
            </h1>
            <p className="text-sm font-medium text-black/60 mt-1 max-w-sm mx-auto">
              Crea tu primera organización para comenzar a gestionar tus propiedades, reservas y operaciones.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-tight font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-black/70 mb-1.5 uppercase tracking-wider">
              Nombre de tu Organización o Empresa
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Ej. Rentals Cancún, Cabañas del Valle, Casonas MX"
                className="w-full pl-4 pr-4 py-3 bg-[#F4F4F2] border border-black/10 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
              />
            </div>
            <p className="text-[11px] text-black/40 mt-1.5 leading-tight">
              Este nombre identificará tu espacio de trabajo y aislará de forma segura tus propiedades y datos financieros.
            </p>
          </div>

          <div className="p-4 bg-[#F8F8F6] rounded-2xl border border-black/5 space-y-2 text-xs text-black/70">
            <div className="font-bold text-[#2D2D2D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¿Qué incluye tu espacio de trabajo?</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc text-black/60 text-[11px]">
              <li>Aislamiento de datos multi-tenant mediante Row Level Security (RLS)</li>
              <li>Ajustes de propiedades, sync iCal, limpiezas y reportes</li>
              <li>Usuario asignado con rol de Propietario / Administrador</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#2D2D2D] hover:bg-black text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Creando Organización...</span>
            ) : (
              <>
                <span>Crear Organización y Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-black/40 pt-2 border-t border-black/5">
          Conectado como <span className="font-semibold text-black/60">{userEmail}</span>
        </div>
      </div>
    </div>
  );
};
