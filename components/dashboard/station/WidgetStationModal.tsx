/**
 * Modale "Widget Station" – même design que le Widget Store (Dashboard).
 * Grille 2 colonnes, cartes avec icône / titre / description / toggle vert.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, RotateCcw, DollarSign, Music2, Mail, Timer, FileText } from 'lucide-react';
import type { WidgetStationId } from '../../../hooks/useWidgetStation';
import { WIDGET_STATION_IDS } from '../../../hooks/useWidgetStation';
import { WidgetCard } from '../WidgetCard';

const STATION_WIDGET_DEFS: Record<
  WidgetStationId,
  { title: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  revenue: {
    title: 'Revenue',
    description: 'Suivi rapide du CA mensuel',
    icon: DollarSign,
  },
  vibe: {
    title: 'Vibe (Spotify)',
    description: 'Mini lecteur pour l\'ambiance du shop',
    icon: Music2,
  },
  inbox: {
    title: 'Inbox',
    description: 'Aperçu des derniers messages non lus',
    icon: Mail,
  },
  timer: {
    title: 'Chronomètre',
    description: 'Calcul du temps de session',
    icon: Timer,
  },
  note: {
    title: 'Note Rapide',
    description: 'Pense-bête persistant',
    icon: FileText,
  },
};

type Props = {
  open: boolean;
  onClose: () => void;
  activeWidgets: WidgetStationId[];
  isActive: (id: WidgetStationId) => boolean;
  toggleWidget: (id: WidgetStationId) => void;
  resetToDefault: () => void;
};

export const WidgetStationModal: React.FC<Props> = ({
  open,
  onClose,
  activeWidgets,
  isActive,
  toggleWidget,
  resetToDefault,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80]"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="widget-station-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,520px)] max-h-[88vh] flex flex-col bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl z-[81] overflow-hidden"
          >
            {/* Header – aligné sur Widget Store */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <LayoutGrid size={18} className="text-zinc-400" />
                </div>
                <div>
                  <h2 id="widget-station-modal-title" className="text-base font-display font-bold text-white">
                    Widget Station
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {activeWidgets.length} widget{activeWidgets.length !== 1 ? 's' : ''} affiché{activeWidgets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Grille de cartes – même design que Widget Store */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 gap-3"
              >
                {WIDGET_STATION_IDS.map((id) => {
                  const def = STATION_WIDGET_DEFS[id];
                  const active = isActive(id);
                  return (
                    <WidgetCard
                      key={id}
                      icon={def.icon}
                      title={def.title}
                      description={def.description}
                      active={active}
                      onToggle={() => toggleWidget(id)}
                      labelActive="Affiché"
                      labelInactive="Ajouter"
                    />
                  );
                })}
              </motion.div>
            </div>

            {/* Footer – Réinitialiser par défaut */}
            <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  resetToDefault();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <RotateCcw size={16} />
                Réinitialiser par défaut
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
