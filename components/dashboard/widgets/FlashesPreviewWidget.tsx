/**
 * Widget "Mes Flashes" – aperçu galerie + lien vers la page Flashs.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '../../../hooks/useDashboardData';

export const FlashesPreviewWidget: React.FC = () => {
  const router = useRouter();
  const { stats, loading } = useDashboardData();
  const count = stats.totalFlashs ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white/5">
            <Clock size={18} className="text-zinc-300" />
          </div>
          <h3 className="text-sm font-semibold text-white">Mes Flashes</h3>
        </div>
        <span className="text-xs text-zinc-400">Galerie rapide</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          {loading ? (
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-display font-bold text-white">{count}</p>
          )}
          <p className="text-xs text-zinc-400 mt-0.5">flashs disponibles</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/dashboard/flashs')}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
        >
          Voir la galerie
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
};
