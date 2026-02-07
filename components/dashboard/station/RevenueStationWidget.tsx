/**
 * Widget Station : Revenue (CA du mois) – version colonne droite.
 */

import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';

const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })));
const Area = lazy(() => import('recharts').then(m => ({ default: m.Area })));
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));

const REVENUE_DATA = [
  { name: 'Lun', value: 1200 },
  { name: 'Mar', value: 2100 },
  { name: 'Mer', value: 1800 },
  { name: 'Jeu', value: 2400 },
  { name: 'Ven', value: 3200 },
  { name: 'Sam', value: 4250 },
  { name: 'Dim', value: 4250 },
];

export const RevenueStationWidget: React.FC = () => {
  const { loading, stats } = useDashboardData();

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden"
    >
      <div className="flex justify-between items-end mb-2 relative z-10">
        <div>
          <div className="text-2xl font-display font-bold text-white">
            {loading ? '...' : `${stats.totalRevenue.toFixed(0)} €`}
          </div>
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
            <ArrowUpRight size={12} /> Revenus totaux
          </div>
        </div>
        <div className="p-2 bg-white/5 rounded-xl">
          <DollarSign size={18} className="text-zinc-400" />
        </div>
      </div>
      <div className="h-14 -mx-4 -mb-4 opacity-40">
        <Suspense fallback={<div className="h-full w-full bg-white/5 rounded animate-pulse" />}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="colorRevenueStation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={1.5} fill="url(#colorRevenueStation)" />
            </AreaChart>
          </ResponsiveContainer>
        </Suspense>
      </div>
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-xs text-zinc-400">
          {stats.upcomingBookings} RDV à venir • {stats.totalFlashs} Flashs
        </span>
      </div>
    </motion.article>
  );
};
