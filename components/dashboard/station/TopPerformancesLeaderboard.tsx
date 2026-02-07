/**
 * Top Performances – liste type leaderboard (Meilleurs Clients).
 * Style "Top Sales Representative" adapté au dark mode.
 */

import React from 'react';
import { motion } from 'framer-motion';

export type LeaderboardBadge = 'VIP' | 'Gold' | 'Nouveau' | null;

export interface LeaderboardItem {
  id: string;
  name: string;
  subtitle: string;
  amount: number;
  badge: LeaderboardBadge;
  avatarInitials: string;
  avatarBg?: string;
}

const MOCK_LEADERBOARD: LeaderboardItem[] = [
  { id: '1', name: 'Julie M.', subtitle: '3 rdv', amount: 450, badge: 'VIP', avatarInitials: 'JM', avatarBg: 'from-amber-200 to-amber-300' },
  { id: '2', name: 'Thomas L.', subtitle: '2 rdv', amount: 320, badge: 'Gold', avatarInitials: 'TL', avatarBg: 'from-slate-200 to-slate-300' },
  { id: '3', name: 'Emma D.', subtitle: 'Réalisé le 12/02', amount: 180, badge: 'Nouveau', avatarInitials: 'ED', avatarBg: 'from-emerald-200 to-teal-300' },
  { id: '4', name: 'Lucas P.', subtitle: '5 rdv', amount: 620, badge: 'VIP', avatarInitials: 'LP', avatarBg: 'from-violet-200 to-purple-300' },
  { id: '5', name: 'Léa B.', subtitle: '2 rdv', amount: 290, badge: null, avatarInitials: 'LB', avatarBg: 'from-rose-200 to-pink-300' },
];

const BADGE_STYLES: Record<NonNullable<LeaderboardBadge>, string> = {
  VIP: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
  Gold: 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700',
  Nouveau: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
};

function LeaderboardRow({
  item,
  index,
}: {
  item: LeaderboardItem;
  index: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-3xl bg-white dark:bg-[#121212] border border-slate-100 dark:border-[#262626] p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-white bg-gradient-to-br ${item.avatarBg ?? 'from-slate-200 to-slate-300 dark:from-neutral-700 dark:to-neutral-600'}`}
      >
        {item.avatarInitials}
      </div>

      {/* Centre-gauche : Nom + sous-titre */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-800 dark:text-white truncate">{item.name}</div>
        <div className="text-xs text-slate-500 dark:text-neutral-400 truncate">{item.subtitle}</div>
      </div>

      {/* Centre-droit : Montant */}
      <div className="text-sm font-semibold text-dash-success tabular-nums flex-shrink-0">
        + {item.amount} €
      </div>

      {/* Droite : Badge pill */}
      {item.badge && (
        <span
          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${BADGE_STYLES[item.badge]}`}
        >
          {item.badge}
        </span>
      )}
    </motion.li>
  );
}

export const TopPerformancesLeaderboard: React.FC = () => {
  return (
    <div className="space-y-3">
      <ul className="flex flex-col gap-2">
        {MOCK_LEADERBOARD.map((item, index) => (
          <LeaderboardRow key={item.id} item={item} index={index} />
        ))}
      </ul>
    </div>
  );
};
