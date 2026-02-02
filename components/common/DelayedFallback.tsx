import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const DELAY_MS = 300;

/**
 * Affiche un spinner de chargement seulement si le chargement dépasse DELAY_MS.
 * Évite le flash du loader pour les navigations rapides (< 300ms).
 */
export const DelayedFallback: React.FC = () => {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSpinner(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center w-full"
      style={{ background: '#0a0a0a' }}
    >
      {showSpinner ? (
        <div className="text-center">
          <Loader2
            className="animate-spin text-amber-400 mx-auto mb-4"
            size={48}
            aria-hidden
          />
          <p className="text-zinc-300 text-sm">Chargement...</p>
        </div>
      ) : null}
    </div>
  );
};
