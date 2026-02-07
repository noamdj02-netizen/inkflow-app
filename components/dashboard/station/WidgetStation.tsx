/**
 * Widget Station – colonne de droite : Top Performances + widgets personnalisables.
 * Largeur fixe w-80, dark mode. Les widgets (Revenue, Vibe, Inbox, etc.) apparaissent/disparaissent via le modal.
 */

import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { TopPerformancesLeaderboard } from './TopPerformancesLeaderboard';
import { WidgetStationModal } from './WidgetStationModal';
import { useWidgetStation } from '../../../hooks/useWidgetStation';

const RevenueStationWidget = lazy(() => import('./RevenueStationWidget').then(m => ({ default: m.RevenueStationWidget })));
const VibeStationWidget = lazy(() => import('./VibeStationWidget').then(m => ({ default: m.VibeStationWidget })));
const InboxStationWidget = lazy(() => import('./InboxStationWidget').then(m => ({ default: m.InboxStationWidget })));
const TimerStationWidget = lazy(() => import('./TimerStationWidget').then(m => ({ default: m.TimerStationWidget })));
const NoteRapideStationWidget = lazy(() => import('./NoteRapideStationWidget').then(m => ({ default: m.NoteRapideStationWidget })));

const WIDGET_MAP = {
  revenue: RevenueStationWidget,
  vibe: VibeStationWidget,
  inbox: InboxStationWidget,
  timer: TimerStationWidget,
  note: NoteRapideStationWidget,
} as const;

export const WidgetStation: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { activeWidgets, isActive, toggleWidget, resetToDefault } = useWidgetStation();

  return (
    <aside className="w-80 flex-shrink-0 hidden xl:flex flex-col h-full min-h-0 bg-white dark:bg-[#121212] border-l border-slate-100 dark:border-[#262626] overflow-hidden shadow-sm">
      {/* Header : titre section + Personnaliser */}
      <div className="p-4 border-b border-slate-100 dark:border-[#262626] flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
            Top Performances
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Personnaliser / Ajouter un widget"
          >
            <LayoutGrid size={14} /> Personnaliser
          </motion.button>
        </div>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Meilleurs clients</p>
      </div>

      {/* Contenu : leaderboard + widgets actifs (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-6">
        <TopPerformancesLeaderboard />
        <div className="grid grid-cols-1 gap-4">
          {activeWidgets.map((id) => {
            const Widget = WIDGET_MAP[id];
            if (!Widget) return null;
            return (
              <Suspense
                key={id}
                fallback={
                  <div className="rounded-3xl border border-slate-100 dark:border-[#262626] bg-[#eff6f3] dark:bg-[#050505] p-4 h-32 animate-pulse" />
                }
              >
                <Widget />
              </Suspense>
            );
          })}
        </div>
      </div>

      <WidgetStationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        activeWidgets={activeWidgets}
        isActive={isActive}
        toggleWidget={toggleWidget}
        resetToDefault={resetToDefault}
      />
    </aside>
  );
};
