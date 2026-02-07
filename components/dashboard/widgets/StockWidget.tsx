/**
 * Widget "Stock" – combien de flashs restants.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';

export const StockWidget: React.FC = () => {
  const { stats, loading } = useDashboardData();
  const count = stats.totalFlashs ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Package size={18} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-white">Stock</h3>
      </div>
      {loading ? (
        <div className="animate-pulse h-14 bg-white/10 rounded-xl" />
      ) : (
        <div className="flex items-center gap-3">
          <div className="text-3xl font-display font-bold text-white">{count}</div>
          <div className="text-sm text-zinc-400">flashs au catalogue</div>
        </div>
      )}
    </motion.div>
  );
};
