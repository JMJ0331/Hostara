import React, { useState } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff, Check, KeyRound, ArrowLeft, RefreshCw, AlertCircle, Sparkles, User, Phone } from 'lucide-react';

interface AuthUser {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  token?: string;
}

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type AuthMode = 'login' | 'register' | 'verify_email' | 'forgot_password' | 'reset_password';

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [devCodeBanner, setDevCodeBanner] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  // Password Reset state
  const [resetCode, setResetCode] = useState('');
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

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          setPendingEmail(data.email || email);
          if (data.devCode) {
            setDevCodeBanner(data.devCode);
          }
          setMode('verify_email');
          setError('Tu correo requiere verificación antes de ingresar. Ingresa el código enviado.');
        } else {
          setError(data.error || 'Credenciales incorrectas');
        }
        return;
      }

      // Success
      if (rememberMe) {
        localStorage.setItem('hostara_session', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('hostara_session', JSON.stringify(data.user));
      }
      onLoginSuccess(data.user);
    } catch (err) {
      setError('Error al conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register (Triggers verification code email)
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, email, password, rememberMe })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al registrar usuario.');
        return;
      }

      setPendingEmail(email);
      setDevCodeBanner(data.devCode || null);
      setSuccessMsg(`Código de verificación enviado a ${email}`);
      setMode('verify_email');
    } catch (err) {
      setError('Error al procesar el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email Verification Code submit
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!verificationCode || verificationCode.length < 4) {
      setError('Por favor ingresa el código de verificación.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: verificationCode })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código incorrecto o expirado.');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('hostara_session', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('hostara_session', JSON.stringify(data.user));
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError('Error al verificar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    clearAlerts();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail })
      });
      const data = await res.json();
      if (data.devCode) {
        setDevCodeBanner(data.devCode);
      }
      setSuccessMsg('Se ha reenviado un nuevo código de verificación a tu correo.');
    } catch (err) {
      setError('Error al reenviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!email) {
      setError('Ingresa tu correo electrónico para recuperar tu contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se encontró la cuenta.');
        return;
      }

      setPendingEmail(email);
      setDevCodeBanner(data.devCode || null);
      setSuccessMsg('Te hemos enviado un código de recuperación a tu correo.');
      setMode('reset_password');
    } catch (err) {
      setError('Error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!resetCode || !newPassword) {
      setError('Ingresa el código y tu nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: resetCode, newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código inválido o error al restablecer.');
        return;
      }

      setSuccessMsg('¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión.');
      setMode('login');
      setPassword('');
    } catch (err) {
      setError('Error al restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 selection:bg-[#2D2D2D] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all">
        
        {/* Subtle decorative top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2D2D2D] via-gray-700 to-[#2D2D2D]" />

        {/* Header with Building Logo */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 bg-[#2D2D2D] rounded-2xl flex items-center justify-center shadow-md mx-auto text-white">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tight text-[#2D2D2D]">Hostara</h1>
            <p className="text-xs font-medium text-black/50 mt-1">
              {mode === 'login' && 'Bienvenido de nuevo. Ingresa a tu plataforma.'}
              {mode === 'register' && 'Crea tu cuenta para gestionar tus rentas vacacionales.'}
              {mode === 'verify_email' && 'Verificación de Seguridad de Correo'}
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

        {/* Dev Mode Verification Code Banner (simulates email receipt) */}
        {devCodeBanner && (mode === 'verify_email' || mode === 'reset_password') && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Simulación de Correo Enviado</span>
            </div>
            <p className="text-[11px] text-amber-700">
              En producción este mensaje llega a la bandeja de entrada del usuario. Tu código de verificación es:
            </p>
            <div className="text-center bg-white border border-amber-300 font-mono text-lg font-bold tracking-widest text-[#2D2D2D] py-1.5 rounded-xl shadow-xs">
              {devCodeBanner}
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-9 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Recordarme & Forgot Password */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-2 font-medium text-[#2D2D2D] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-black/20 text-[#2D2D2D] focus:ring-0 w-3.5 h-3.5"
                />
                <span>Recordarme</span>
              </label>

              <button
                type="button"
                onClick={() => { setMode('forgot_password'); clearAlerts(); }}
                className="font-semibold text-purple-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-2xl text-xs font-bold justify-center shadow-md shadow-black/10 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            {/* Nombre y Apellido side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block font-semibold text-[#2D2D2D] mb-1">Nombre</label>
                <div className="relative">
                  <User className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2D2D2D] mb-1">Apellido</label>
                <div className="relative">
                  <User className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez"
                    className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Número Personal */}
            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Número Personal</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 555 123 4567"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-9 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Repetir Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-9 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Recordarme */}
            <div className="flex items-center text-[11px] pt-1">
              <label className="flex items-center gap-2 font-medium text-[#2D2D2D] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-black/20 text-[#2D2D2D] focus:ring-0 w-3.5 h-3.5"
                />
                <span>Recordarme en este dispositivo</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-2xl text-xs font-bold justify-center shadow-md shadow-black/10 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {isLoading ? 'Procesando...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        {/* EMAIL VERIFICATION CODE STEP */}
        {mode === 'verify_email' && (
          <form onSubmit={handleVerifyCode} className="space-y-4 text-xs">
            <div className="text-center bg-[#FAFAF8] p-3 rounded-2xl border border-black/5">
              <p className="text-black/60 text-[11px]">
                Se ha enviado un código de verificación a:
              </p>
              <p className="font-bold text-[#2D2D2D] text-xs mt-0.5">{pendingEmail}</p>
            </div>

            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Código de Verificación (6 dígitos)</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Ej: 123456"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 text-center tracking-widest font-mono text-base text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-2xl text-xs font-bold justify-center shadow-md shadow-black/10 transition-all mt-2"
            >
              {isLoading ? 'Verificando...' : 'Verificar y Registrarse'}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-black/5">
              <button
                type="button"
                onClick={() => { setMode('register'); clearAlerts(); }}
                className="text-black/50 hover:text-black text-[11px] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-purple-700 hover:underline font-semibold text-[11px] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reenviar código</span>
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
            <p className="text-black/60 text-[11px]">
              Ingresa el correo electrónico asociado a tu cuenta para recibir un código de recuperación.
            </p>

            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-2xl text-xs font-bold justify-center shadow-md transition-all"
            >
              {isLoading ? 'Enviando...' : 'Enviar Código de Recuperación'}
            </button>

            <div className="text-center pt-2 border-t border-black/5">
              <button
                type="button"
                onClick={() => { setMode('login'); clearAlerts(); }}
                className="text-black/60 hover:text-black font-semibold text-[11px] inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Iniciar Sesión</span>
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Código de Recuperación</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Código de 6 dígitos"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 text-center tracking-widest font-mono text-base text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#2D2D2D] mb-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#FAFAF8] border border-black/10 rounded-xl pl-9 pr-9 py-2.5 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]/20 focus:border-[#2D2D2D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-2xl text-xs font-bold justify-center shadow-md transition-all"
            >
              {isLoading ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
