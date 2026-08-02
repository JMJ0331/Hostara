import React, { useState, useEffect } from 'react';
import { 
  X, User, ShieldCheck, FileText, Lock, Mail, Phone, Eye, EyeOff, 
  Camera, KeyRound, CheckCircle2, AlertCircle
} from 'lucide-react';

interface UserProfileData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfileData;
  onUpdateUser: (updatedUser: UserProfileData) => void;
}

type TabType = 'perfil' | 'privacidad' | 'legal';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
];

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('perfil');

  // Profile Form state
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [currentPasswordConfirm, setCurrentPasswordConfirm] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setCurrentPasswordConfirm('');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (email !== currentUser.email && !currentPasswordConfirm) {
      setErrorMsg('Por protocolos de seguridad, ingresa tu contraseña actual para cambiar tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email 
        },
        body: JSON.stringify({
          email: currentUser.email,
          currentPassword: currentPasswordConfirm || undefined,
          firstName,
          lastName,
          phone,
          newEmail: email !== currentUser.email ? email : undefined,
          avatarUrl
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar el perfil');
      }

      setSuccessMsg('¡Perfil y datos guardados exitosamente!');
      setCurrentPasswordConfirm('');
      onUpdateUser({
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        phone: data.user.phone,
        avatarUrl: data.user.avatarUrl
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setErrorMsg('Por favor completa todos los campos de contraseña.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          currentPassword: oldPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      setSuccessMsg('¡Contraseña actualizada con éxito! Utiliza tu nueva contraseña en tu próximo inicio de sesión.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-black/10 shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-black/10 flex items-center justify-between bg-[#FAFAF8] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2D2D2D] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-[#2D2D2D]">Configuración de Cuenta</h2>
              <p className="text-[11px] sm:text-xs text-black/50">Gestiona tu perfil, seguridad y preferencias de la cuenta</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-black/40 hover:text-black hover:bg-black/5 rounded-xl"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Horizontal scroll tabs on mobile/tablet, Sidebar on desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="w-full md:w-56 bg-[#FAFAF8] p-2 sm:p-3 border-b md:border-b-0 md:border-r border-black/10 flex md:flex-col gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            <button
              type="button"
              onClick={() => { setActiveTab('perfil'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 md:w-full ${
                activeTab === 'perfil' 
                  ? 'bg-[#2D2D2D] text-white shadow-xs' 
                  : 'text-black/70 hover:bg-black/5'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Perfil</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('privacidad'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 md:w-full ${
                activeTab === 'privacidad' 
                  ? 'bg-[#2D2D2D] text-white shadow-xs' 
                  : 'text-black/70 hover:bg-black/5'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Privacidad</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('legal'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 md:w-full ${
                activeTab === 'legal' 
                  ? 'bg-[#2D2D2D] text-white shadow-xs' 
                  : 'text-black/70 hover:bg-black/5'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Uso de Datos (Legal)</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-white">
            
            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* TAB 1: PERFIL */}
            {activeTab === 'perfil' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                
                {/* Photo / Avatar Selector */}
                <div>
                  <label className="block font-semibold text-[#2D2D2D] mb-2">Foto de Perfil</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="relative group shrink-0">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-black/10 shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#2D2D2D] text-white font-bold text-xl flex items-center justify-center border-2 border-black/10 shadow-xs">
                          {firstName ? firstName[0].toUpperCase() : 'U'}
                        </div>
                      )}
                      <label className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border border-black/10 shadow-md cursor-pointer hover:bg-gray-100">
                        <Camera className="w-3.5 h-3.5 text-black/70" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleCustomPhotoUpload}
                        />
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-[#2D2D2D]">Seleccionar Avatar Predefinido:</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(preset)}
                            className={`w-8 h-8 rounded-xl overflow-hidden border-2 shrink-0 ${
                              avatarUrl === preset ? 'border-[#2D2D2D] scale-110 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="text-[10px] text-rose-600 font-semibold hover:underline ml-1"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2D2D2D] mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2D2D2D] mb-1">Apellido</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]"
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2D2D2D] mb-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#2D2D2D] mb-1">Número Personal</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
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
                        placeholder="+52 555 123 4567"
                        className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Protocol Confirmation Password */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Confirmación de Seguridad</span>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    {email !== currentUser.email 
                      ? 'Requerido: Ingresa tu contraseña actual para autorizar el cambio de correo.' 
                      : 'Opcional: Ingresa tu contraseña actual si deseas verificar los datos.'}
                  </p>
                  <div>
                    <input
                      type="password"
                      placeholder={email !== currentUser.email ? 'Contraseña actual (Requerida para cambio de email)' : 'Contraseña actual (Opcional)'}
                      value={currentPasswordConfirm}
                      onChange={(e) => setCurrentPasswordConfirm(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-[#2D2D2D] focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#2D2D2D] hover:bg-black text-white w-full sm:w-auto justify-center py-2.5 px-5 rounded-xl text-xs font-bold shadow-xs hover:shadow-md cursor-pointer"
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios de Perfil'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PRIVACIDAD */}
            {activeTab === 'privacidad' && (
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center gap-2.5 text-blue-900">
                  <Lock className="w-4 h-4 text-blue-700 shrink-0" />
                  <p className="text-[11px]">
                    Asegúrate de utilizar una contraseña segura con al menos 6 caracteres y caracteres combinados.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#2D2D2D] mb-1">Contraseña Actual</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña actual"
                      className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-9 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                    >
                      {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2D2D2D] mb-1">Nueva Contraseña</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-9 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#2D2D2D] mb-1">Confirmar Nueva Contraseña</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repite tu nueva contraseña"
                        className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2D2D] focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#2D2D2D] hover:bg-black text-white w-full sm:w-auto justify-center py-2.5 px-5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: LEGAL / USO DE DATOS */}
            {activeTab === 'legal' && (
              <div className="space-y-4 text-xs text-[#2D2D2D]">
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-xs text-emerald-950">Compromiso de Protección y Privacidad</h3>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Tus datos personales y la información de tus propiedades y huéspedes son tratados bajo rigurosos protocolos de confidencialidad.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 divide-y divide-black/5 text-[11px]">
                  
                  <div className="pt-2">
                    <h4 className="font-bold text-xs text-[#2D2D2D] mb-1">1. Finalidad del Tratamiento de Datos</h4>
                    <p className="opacity-80 leading-relaxed">
                      La información proporcionada (Nombre, Apellido, Correo Electrónico, Teléfono, así como las direcciones y calendarios iCal de tus propiedades) se utiliza exclusivamente para la gestión de reservas, control de limpiezas, asignación a propietarios y generación de reportes financieros.
                    </p>
                  </div>

                  <div className="pt-3">
                    <h4 className="font-bold text-xs text-[#2D2D2D] mb-1">2. Confidencialidad e Integración iCal</h4>
                    <p className="opacity-80 leading-relaxed">
                      Los enlaces iCal sincronizados con Airbnb, Booking u otras plataformas no son comercializados ni compartidos con terceros. Se procesan de forma automatizada para sincronizar ocupación y evitar duplicidad de reservas.
                    </p>
                  </div>

                  <div className="pt-3">
                    <h4 className="font-bold text-xs text-[#2D2D2D] mb-1">3. Protocolos de Seguridad del Sistema</h4>
                    <p className="opacity-80 leading-relaxed">
                      Toda comunicación entre tu navegador y la aplicación viaja encriptada mediante protocolos TLS/HTTPS. Las contraseñas se almacenan mediante algoritmos de hash seguros y nunca son visibles en texto plano.
                    </p>
                  </div>

                  <div className="pt-3">
                    <h4 className="font-bold text-xs text-[#2D2D2D] mb-1">4. Derechos ARCO (Acceso, Rectificación, Cancelación)</h4>
                    <p className="opacity-80 leading-relaxed">
                      Como titular de la cuenta, conservas en todo momento el derecho a modificar, actualizar o eliminar tu información de perfil desde esta misma interfaz o solicitando la baja definitiva de tu usuario.
                    </p>
                  </div>

                </div>

                <div className="pt-2 text-center text-[10px] opacity-50">
                  Hostara Manager v2.4 • Última actualización de Términos: Julio 2026
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
