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
      className="p-6 h-full min-h-0 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-dash-primary/10">
            <Clock size={18} className="text-dash-primary" strokeWidth={1.8} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Mes Flashes</h3>
        </div>
        <span className="text-xs text-foreground-muted">Galerie rapide</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{count}</p>
          )}
          <p className="text-xs text-foreground-muted mt-0.5">flashs disponibles</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/dashboard/flashs')}
          className="flex items-center gap-1.5 text-sm font-medium text-dash-primary hover:opacity-90 transition-colors"
        >
          Voir la galerie
          <ChevronRight size={16} strokeWidth={1.8} />
        </motion.button>
      </div>
    </motion.div>
  );
};
