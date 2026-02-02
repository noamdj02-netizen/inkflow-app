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
  { id: '1', name: 'Julie M.', subtitle: '3 rdv', amount: 450, badge: 'VIP', avatarInitials: 'JM', avatarBg: 'from-amber-500/40 to-orange-600/40' },
  { id: '2', name: 'Thomas L.', subtitle: '2 rdv', amount: 320, badge: 'Gold', avatarInitials: 'TL', avatarBg: 'from-zinc-400/40 to-zinc-500/40' },
  { id: '3', name: 'Emma D.', subtitle: 'Réalisé le 12/02', amount: 180, badge: 'Nouveau', avatarInitials: 'ED', avatarBg: 'from-emerald-500/40 to-teal-600/40' },
  { id: '4', name: 'Lucas P.', subtitle: '5 rdv', amount: 620, badge: 'VIP', avatarInitials: 'LP', avatarBg: 'from-violet-500/40 to-purple-600/40' },
  { id: '5', name: 'Léa B.', subtitle: '2 rdv', amount: 290, badge: null, avatarInitials: 'LB', avatarBg: 'from-rose-500/40 to-pink-600/40' },
];

const BADGE_STYLES: Record<NonNullable<LeaderboardBadge>, string> = {
  VIP: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  Gold: 'bg-zinc-400/20 text-zinc-300 border border-zinc-500/30',
  Nouveau: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
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
      className="rounded-xl bg-[#1A1A1A] border border-white/5 p-3 flex items-center gap-3 hover:bg-white/[0.06] transition-colors"
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br ${item.avatarBg ?? 'from-zinc-500/40 to-zinc-600/40'}`}
      >
        {item.avatarInitials}
      </div>

      {/* Centre-gauche : Nom + sous-titre */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{item.name}</div>
        <div className="text-xs text-zinc-500 truncate">{item.subtitle}</div>
      </div>

      {/* Centre-droit : Montant */}
      <div className="text-sm font-semibold text-emerald-400 tabular-nums flex-shrink-0">
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
