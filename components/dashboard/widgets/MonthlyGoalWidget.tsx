/**
 * Widget "Objectif du mois" – jauge de progression du CA.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';

const DEFAULT_GOAL = 5000; // €

export const MonthlyGoalWidget: React.FC = () => {
  const { stats, loading } = useDashboardData();
  const revenue = stats.totalRevenue ?? 0;
  const goal = DEFAULT_GOAL;
  const pct = goal > 0 ? Math.min(Math.round((revenue / goal) * 100), 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-white">Objectif du mois</h3>
      </div>
      {loading ? (
        <div className="animate-pulse h-20 bg-white/10 rounded-xl" />
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-display font-bold text-white">
              {revenue.toFixed(0)} €
            </span>
            <span className="text-xs text-zinc-500">/ {goal} €</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <div className="text-xs text-zinc-400">{pct} % de l&apos;objectif</div>
        </div>
      )}
    </motion.div>
  );
};
