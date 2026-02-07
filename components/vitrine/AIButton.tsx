import React, { useState } from 'react';
import { AIConsultant } from '../AIConsultant';

export interface AIButtonProps {
  artistName: string;
}

/** Bouton flottant pour ouvrir le consultant IA. Positionné au-dessus du CTA mobile (bottom-20) pour ne pas chevaucher. */
export function AIButton({ artistName }: AIButtonProps) {
  const [showAI, setShowAI] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowAI(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 p-3 sm:p-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full glass-vitrine transition-all hover:scale-110 shadow-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Ouvrir le consultant IA"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
      <AIConsultant isOpen={showAI} onClose={() => setShowAI(false)} artistName={artistName} />
    </>
  );
}
