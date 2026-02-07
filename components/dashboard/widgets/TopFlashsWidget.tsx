/**
 * Widget "Top Flashs" – les dessins les plus vendus.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';

export const TopFlashsWidget: React.FC = () => {
  const { stats, loading } = useDashboardData();
  const totalFlashs = stats.totalFlashs ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/10"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={18} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-white">Top Flashs</h3>
      </div>
      {loading ? (
        <div className="animate-pulse h-16 bg-white/10 rounded-xl" />
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Zap size={24} className="text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white">{totalFlashs}</div>
            <div className="text-xs text-zinc-400">flashs disponibles au catalogue</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
