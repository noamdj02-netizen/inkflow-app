/**
 * Widget "Panier Moyen" – montant moyen par réservation.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';

export const AverageCartWidget: React.FC = () => {
  const { stats, recentBookings, loading } = useDashboardData();
  const totalRevenue = stats.totalRevenue ?? 0;
  const count = recentBookings?.length ?? 0;
  const average = count > 0 ? totalRevenue / count : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart size={18} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-white">Panier Moyen</h3>
      </div>
      {loading ? (
        <div className="animate-pulse h-14 bg-white/10 rounded-xl" />
      ) : (
        <div className="flex items-center gap-3">
          <div className="text-2xl font-display font-bold text-white">
            {average.toFixed(0)} €
          </div>
          <div className="text-sm text-zinc-400">
            par réservation {count > 0 ? `(${count} RDV)` : ''}
          </div>
        </div>
      )}
    </motion.div>
  );
};
