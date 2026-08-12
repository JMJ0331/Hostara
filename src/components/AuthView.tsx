import React, { useState } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff, Check, KeyRound, ArrowLeft, AlertCircle, User, Phone } from 'lucide-react';
import { 
  signInWithSupabase, 
  signUpWithSupabase, 
  sendPasswordResetEmail, 
  updateSupabasePassword 
} from '../services/authService';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password' | 'reset_password';

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Reset state
  const [newPassword, setNewPassword] = useState('');

  // UI status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form messages
  const clearAlerts = () => {
    setError(null);
    setSuccessMsg(null);
  };

  // Handle Login with Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await signInWithSupabase(email.trim(), password);
      if (data.user) {
        const meta = data.user.user_metadata || {};
        onLoginSuccess({
          id: data.user.id,
          email: data.user.email || email,
          firstName: meta.first_name || meta.firstName || '',
          lastName: meta.last_name || meta.lastName || '',
          phone: meta.phone || ''
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Error al iniciar sesión. Revisa tus credenciales.';
      if (err.message?.includes('Invalid login credentials')) {
        message = 'Correo o contraseña incorrectos. Verifica tus datos.';
      } else if (err.message?.includes('Email not confirmed')) {
        message = 'Tu correo electrónico no ha sido confirmado. Revisa tu bandeja de entrada.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register with Supabase Auth
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await signUpWithSupabase({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim()
      });

      if (data.user && data.session) {
        // Immediate session granted (auto-confirm enabled or dev)
        onLoginSuccess({
          id: data.user.id,
          email: data.user.email || email,
          firstName,
          lastName,
          phone
        });
      } else if (data.user) {
        // Confirmation email sent
        setSuccessMsg(`Cuenta creada para ${email}. Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada.`);
        setMode('login');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = 'Error al registrar usuario.';
      if (err.message?.includes('User already registered')) {
        message = 'El correo electrónico ya se encuentra registrado. Intenta iniciar sesión.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Request via Supabase Auth
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!email) {
      setError('Ingresa tu correo electrónico para recuperar tu contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(email.trim());
      setSuccessMsg('Te hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Error al solicitar la recuperación de contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!newPassword) {
      setError('Ingresa tu nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      await updateSupabasePassword(newPassword);
      setSuccessMsg('¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión.');
      setMode('login');
      setPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 selection:bg-[#2D2D2D] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all">
        
        {/* Subtle decorative top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2D2D2D] via-gray-700 to-[#2D2D2D]" />

        {/* Header with Building Logo */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 bg-[#2D2D2D] rounded-2xl flex items-center justify-center shadow-sm mx-auto text-white">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-[#2D2D2D]">Hostara</h1>
            <p className="text-xs font-medium text-black/50 mt-1">
              {mode === 'login' && 'Bienvenido de nuevo. Ingresa a tu plataforma.'}
              {mode === 'register' && 'Crea tu cuenta para gestionar tus rentas vacacionales.'}
              {mode === 'forgot_password' && 'Recuperación de Contraseña'}
              {mode === 'reset_password' && 'Restablece tu Contraseña'}
            </p>
          </div>
        </div>

        {/* Auth Mode Toggle Tabs (Only shown on login or register modes) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="grid grid-cols-2 p-1 bg-[#F4F4F2] rounded-2xl gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); clearAlerts(); }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#2D2D2D] shadow-xs'
                  : 'text-black/50 hover:text-black'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); clearAlerts(); }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#2D2D2D] shadow-xs'
                  : 'text-black/50 hover:text-black'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-tight font-medium">{successMsg}</span>
          </div>
        )}

        {/* Form: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-black/70 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@dominio.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-black/70">Contraseña</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); clearAlerts(); }}
                  className="text-[11px] text-black/60 hover:text-black underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2D2D2D] hover:bg-black text-white font-semibold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Iniciando sesión...' : 'Ingresar a Hostara'}
            </button>
          </form>
        )}

        {/* Form: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-black/70 mb-1">Nombre</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    className="w-full pl-9 pr-3 py-2 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-black/70 mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pérez"
                  className="w-full px-3 py-2 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black/70 mb-1">Teléfono Móvil</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 998 123 4567"
                  className="w-full pl-9 pr-3 py-2 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black/70 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@dominio.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black/70 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-9 py-2 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black/70 mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-9 pr-9 py-2 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2D2D2D] hover:bg-black text-white font-semibold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Registrando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        {/* Form: FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-black/70 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingresa el correo de tu cuenta"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2D2D2D] hover:bg-black text-white font-semibold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); clearAlerts(); }}
              className="w-full py-2.5 text-xs text-black/60 hover:text-black font-semibold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Iniciar Sesión</span>
            </button>
          </form>
        )}

        {/* Form: RESET PASSWORD */}
        {mode === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-black/70 mb-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F4F4F2] border border-black/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] focus:bg-white transition-all text-[#2D2D2D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2D2D2D] hover:bg-black text-white font-semibold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); clearAlerts(); }}
              className="w-full py-2.5 text-xs text-black/60 hover:text-black font-semibold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Iniciar Sesión</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
