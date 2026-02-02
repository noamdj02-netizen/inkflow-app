import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * État de chargement affiché immédiatement (frame 0) pendant le lazy-load des routes.
 * Évite tout écran blanc/noir/vide : même fond que l'app + spinner + label.
 */
export const PageLoadingFallback: React.FC = () => (
  <div
    className="min-h-screen flex items-center justify-center w-full relative overflow-hidden"
    style={{ background: '#0a0a0a' }}
    role="status"
    aria-live="polite"
    aria-label="Chargement en cours"
  >
    {/* Fond cohérent avec le reste de l'app (micro-glows) */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
    <div className="text-center relative z-10">
      <span className="text-2xl font-display font-bold tracking-tight text-white/90">
        INK<span className="text-zinc-500">FLOW</span>
      </span>
      <Loader2
        className="animate-spin text-amber-400 mx-auto mt-4 mb-2"
        size={32}
        aria-hidden
      />
      <p className="text-zinc-400 text-sm">Chargement...</p>
    </div>
  </div>
);
