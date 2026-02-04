/**
 * Bouton flottant pour ouvrir le QuickAdd (Nouveau RDV) sur mobile.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export interface QuickAddFABProps {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export function QuickAddFAB({
  onClick,
  className = '',
  ariaLabel = 'Nouveau rendez-vous',
}: QuickAddFABProps) {
  return (
    <motion.button
      type="button"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white text-black shadow-lg shadow-black/30 flex items-center justify-center touch-manipulation active:scale-95 transition-shadow hover:shadow-xl hover:shadow-black/40 ${className}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <Plus size={24} strokeWidth={2.5} />
    </motion.button>
  );
}
