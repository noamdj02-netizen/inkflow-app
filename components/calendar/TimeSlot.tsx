/**
 * Un créneau horaire cliquable pour l’éditeur de disponibilités (mode peinture).
 */
import React from 'react';
import { motion } from 'framer-motion';
import type { PaintMode } from '../../types/calendar';
export interface TimeSlotProps {
  day: number;
  hour: number;
  isAvailable: boolean;
  isPainting: boolean;
  paintMode: PaintMode;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseEnter: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function TimeSlot({
  day,
  hour,
  isAvailable,
  isPainting,
  paintMode,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  className = '',
}: TimeSlotProps) {
  const isGreen = isAvailable;
  const base =
    'h-10 sm:h-12 rounded-md cursor-pointer border-2 transition-colors select-none touch-manipulation ' +
    (isGreen
      ? 'bg-emerald-500/30 border-emerald-400/50 hover:bg-emerald-500/40 '
      : 'bg-red-500/20 border-red-400/40 hover:bg-red-500/30 ');

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${dayLabels[day]} ${hour}h – ${isAvailable ? 'disponible' : 'bloqué'}`}
      className={base + className}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown();
      }}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseEnter={() => {
        onMouseEnter();
      }}
      onPointerLeave={onMouseLeave}
    />
  );
}
