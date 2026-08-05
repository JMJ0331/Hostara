import React, { useState } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, WifiOff, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isStandalone, isOnline, isIOS, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  // If already running in standalone mode (PWA installed) or dismissed, do not show main banner
  if (isStandalone) {
    return (
      !isOnline ? (
        <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-sm sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Modo Offline activo — Estás usando Hostara sin conexión. Algunas acciones se sincronizarán al conectar.</span>
        </div>
      ) : null
    );
  }

  return (
    <>
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-md sticky top-0 z-50 animate-fade-in">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Modo Sin Conexión — Visualizando datos guardados localmente.</span>
        </div>
      )}

      {/* PWA Floating App Banner */}
      {!dismissed && (isInstallable || isIOS) && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-[#1E1E1E] text-white p-4 rounded-2xl shadow-2xl border border-white/10 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#2D2D2D] border border-white/20 flex items-center justify-center shrink-0 shadow-md">
              <img src="/icon.svg" alt="Hostara App Icon" className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-sm text-white tracking-tight">Instalar Hostara</h4>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Cerrar banner de instalación"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                Accede a tus reservaciones y limpiezas directo desde tu pantalla de inicio, con soporte offline.
              </p>

              <div className="mt-3 flex items-center gap-2">
                {isInstallable && (
                  <button
                    onClick={promptInstall}
                    className="bg-[#FAFAF8] text-[#2D2D2D] hover:bg-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar Aplicación</span>
                  </button>
                )}

                {isIOS && !isInstallable && (
                  <button
                    onClick={() => setShowIOSModal(true)}
                    className="bg-[#FAFAF8] text-[#2D2D2D] hover:bg-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Ver cómo instalar en iPhone</span>
                  </button>
                )}

                <button
                  onClick={() => setDismissed(true)}
                  className="text-xs text-white/50 hover:text-white px-2 py-2 transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Help Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-6 text-[#2D2D2D] shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2D2D2D] text-white flex items-center justify-center font-bold">
                <img src="/icon.svg" alt="Hostara" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Instalar en iPhone / iPad</h3>
                <p className="text-xs text-black/50">Sigue estos sencillos pasos en Safari:</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-black/80 pt-2">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-black/5 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span>Toca el botón de <strong>Compartir <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /></strong> en la barra inferior de Safari.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-black/5 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span>Desplázate hacia abajo y selecciona <strong>Agregar a inicio <PlusSquare className="w-3.5 h-3.5 inline text-black/70 mx-0.5" /></strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-black/5 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <span>Haz clic en <strong>Agregar</strong> arriba a la derecha. ¡Listo!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full btn-primary text-xs py-2.5 justify-center mt-2 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
