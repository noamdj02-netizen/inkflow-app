import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Redirection unique vers "/" pour les routes inconnues.
 * Affiche immédiatement un état de chargement pour éviter un écran vide.
 */
export const RedirectToHome: React.FC = () => {
  const navigate = useNavigate();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
      aria-live="polite"
      aria-label="Redirection en cours"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="text-center relative z-10">
        <Loader2 className="animate-spin text-amber-400 mx-auto mb-3" size={36} aria-hidden />
        <p className="text-zinc-400 text-sm">Redirection...</p>
      </div>
    </div>
  );
};
