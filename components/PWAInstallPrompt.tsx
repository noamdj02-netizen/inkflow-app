import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share2, Download, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Détection device : iOS, Android, ou déjà en mode standalone */
export function useInstallState() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const android = /Android/.test(ua);
    setIsIOS(iOS);
    setIsAndroid(android);

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(!!standalone);

    if (standalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  return { deferredPrompt, isIOS, isAndroid, isInstalled };
}

/** Modale iOS : instructions visuelles Partager → Sur l'écran d'accueil */
export const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-white">Installer sur iPhone</h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg" aria-label="Fermer">
          <X size={20} />
        </button>
      </div>

      <p className="text-slate-400 text-sm mb-5">
        Safari ne permet pas l'installation en un clic. Suivez ces étapes :
      </p>

      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 font-bold">1</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white mb-1">Appuyez sur le bouton Partager</p>
            <p className="text-slate-400 text-sm mb-2">L'icône en bas au centre de Safari (carré avec flèche vers le haut)</p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
              <Share2 size={20} className="text-amber-400" />
              <span className="text-sm text-slate-300">Partager</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 font-bold">2</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white mb-1">Sélectionnez « Sur l'écran d'accueil »</p>
            <p className="text-slate-400 text-sm mb-2">Faites défiler le menu et touchez cette option</p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
              <Home size={20} className="text-amber-400" />
              <span className="text-sm text-slate-300">Sur l'écran d'accueil</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 font-bold">3</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white mb-1">Confirmez</p>
            <p className="text-slate-400 text-sm">L'icône InkFlow sera ajoutée à votre écran d'accueil.</p>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 bg-amber-400 text-black font-bold py-3 rounded-xl hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
      >
        Compris
      </button>
    </motion.div>
  </motion.div>
);

export const PWAInstallPrompt: React.FC = () => {
  const { deferredPrompt, isIOS, isInstalled } = useInstallState();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (deferredPrompt) setShowPrompt(true);
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) setShowIOSInstructions(true);
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
  };

  if (isInstalled) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && deferredPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          >
            <div className="bg-slate-800 border border-amber-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone className="text-amber-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">Installer InkFlow</h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Ajoutez InkFlow à votre écran d'accueil pour un accès rapide.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 bg-amber-400 text-black font-bold py-2.5 px-4 rounded-xl hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Installer
                    </button>
                    <button
                      onClick={() => setShowPrompt(false)}
                      className="p-2.5 text-slate-400 hover:text-white transition-colors"
                      aria-label="Fermer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSInstructions && (
          <IOSInstallModal onClose={() => setShowIOSInstructions(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

/** Bouton d'installation mis en avant (dashboard) : Android = beforeinstallprompt, iOS = modale explicative. Masqué si déjà installé. */
export const PWAInstallButton: React.FC<{ onClose?: () => void; variant?: 'sidebar' | 'prominent' }> = ({
  onClose,
  variant = 'prominent',
}) => {
  const { deferredPrompt, isIOS, isInstalled } = useInstallState();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleClick = async () => {
    onClose?.();

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        /* installed */
      }
    }
  };

  if (isInstalled) return null;

  const isProminent = variant === 'prominent';
  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        className={
          isProminent
            ? 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-amber-400/20 text-amber-400 border border-amber-500/30 hover:bg-amber-400/30 hover:text-amber-300 transition-all'
            : 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all'
        }
      >
        <Download size={18} className={isProminent ? 'shrink-0' : ''} />
        <span>Installer l'application</span>
      </button>

      <AnimatePresence>
        {showIOSModal && (
          <IOSInstallModal onClose={() => setShowIOSModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
};
