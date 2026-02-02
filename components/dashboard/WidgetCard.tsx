/**
 * Carte widget partagée – Widget Store (Dashboard) et Widget Station (Sidebar).
 * Grille : icône à gauche, titre + description, toggle vert, bordure verte si actif.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export type WidgetCardIcon = React.ComponentType<{ size?: number; className?: string }>;

type Props = {
  icon: WidgetCardIcon;
  title: string;
  description: string;
  active: boolean;
  onToggle: () => void;
  /** Texte sous la carte : état actif (ex. "Sur le dashboard") */
  labelActive?: string;
  /** Texte sous la carte : état inactif (ex. "Ajouter au dashboard") */
  labelInactive?: string;
};

const DEFAULT_LABELS = {
  labelActive: 'Sur le dashboard',
  labelInactive: 'Ajouter au dashboard',
};

export const WidgetCard: React.FC<Props> = ({
  icon: Icon,
  title,
  description,
  active,
  onToggle,
  labelActive = DEFAULT_LABELS.labelActive,
  labelInactive = DEFAULT_LABELS.labelInactive,
}) => {
  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`relative rounded-xl border p-4 transition-all cursor-pointer select-none ${
        active
          ? 'bg-white/5 border-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]'
          : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      {active && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'
          }`}
        >
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{description}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          {active ? labelActive : labelInactive}
        </span>
        <div
          className={`relative w-9 h-5 rounded-full transition-colors ${
            active ? 'bg-emerald-500' : 'bg-white/20'
          }`}
          aria-hidden
        >
          <motion.span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
            style={{ left: 2 }}
            animate={{ left: active ? 18 : 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </div>
      </div>
    </motion.div>
  );
};
