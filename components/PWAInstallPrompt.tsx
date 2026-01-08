import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Écouter l'événement beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Si pas de prompt (iOS), afficher les instructions
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }

    // Afficher le prompt d'installation
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  // Ne rien afficher si déjà installé
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Prompt Android/Chrome */}
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

      {/* Instructions iOS */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowIOSInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Installer sur iPhone</h3>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-400/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-white mb-1">Appuyez sur le bouton Partager</p>
                    <p className="text-sm text-slate-400">
                      <Share2 size={14} className="inline mr-1" />
                      Trouvez l'icône de partage en bas de l'écran
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-400/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-white mb-1">Sélectionnez "Sur l'écran d'accueil"</p>
                    <p className="text-sm text-slate-400">
                      Faites défiler le menu et choisissez cette option
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-400/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-white mb-1">Confirmez l'installation</p>
                    <p className="text-sm text-slate-400">
                      L'icône InkFlow apparaîtra sur votre écran d'accueil
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full mt-6 bg-amber-400 text-black font-bold py-3 rounded-xl hover:bg-amber-300 transition-colors"
              >
                Compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Composant bouton d'installation pour le menu mobile
export const PWAInstallButton: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleClick = async () => {
    if (onClose) onClose();

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
      >
        <Smartphone size={18} />
        <span>Installer l'application</span>
      </button>

      {/* Modal iOS simplifiée */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-white mb-3">Installer sur iPhone</h3>
              <p className="text-slate-300 text-sm mb-4">
                Appuyez sur <Share2 size={14} className="inline mx-1" /> <strong>Partager</strong>, puis sélectionnez <strong>"Sur l'écran d'accueil"</strong>.
              </p>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-amber-400 text-black font-bold py-2.5 rounded-xl hover:bg-amber-300"
              >
                Compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

