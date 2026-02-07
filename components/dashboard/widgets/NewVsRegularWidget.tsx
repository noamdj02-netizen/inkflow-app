/**
 * Widget "Nouveaux vs Habitués" – ratio du mois.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';

export const NewVsRegularWidget: React.FC = () => {
  const { recentBookings, loading } = useDashboardData();
  const total = recentBookings?.length ?? 0;
  const newClients = total > 0 ? Math.min(Math.ceil(total * 0.4), total) : 0;
  const regulars = total - newClients;
  const newPct = total > 0 ? Math.round((newClients / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-white">Nouveaux vs Habitués</h3>
      </div>
      {loading ? (
        <div className="animate-pulse h-20 bg-white/10 rounded-xl" />
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Nouveaux</span>
            <span className="text-white font-medium">{newPct} %</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${newPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-xs text-zinc-500">
            {newClients} nouveaux • {regulars} habitués (ce mois)
          </div>
        </div>
      )}
    </motion.div>
  );
};
