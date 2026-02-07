/**
 * Statistiques détaillées – CA du mois, nombre de clients, taux de remplissage avec évolution.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { useKPIsSWR } from '../../../hooks/useDashboardSWR';
import { useDashboardDataSWR } from '../../../hooks/useDashboardSWR';
import { KPISkeleton, WidgetErrorFallback } from './WidgetSkeleton';

export const StatsWidget: React.FC = () => {
  const { kpis, loading: kpiLoading, error: kpiError, refresh } = useKPIsSWR();
  const { stats, loading: statsLoading, error: statsError } = useDashboardDataSWR();

  const loading = kpiLoading || statsLoading;
  const error = kpiError || statsError;

  if (loading && kpis.monthlyRevenue === 0 && stats.upcomingBookings === 0) {
    return <KPISkeleton />;
  }

  if (error) {
    return (
      <WidgetErrorFallback
        message="Les statistiques n'ont pas pu être chargées."
        onRetry={() => refresh()}
      />
    );
  }

  const cards = [
    {
      label: 'CA du mois',
      value: kpis.monthlyRevenue.toLocaleString('fr-FR'),
      suffix: ' €',
      icon: DollarSign,
      iconBg: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      label: 'RDV à venir',
      value: stats.upcomingBookings.toString(),
      suffix: '',
      icon: Calendar,
      iconBg: 'bg-cyan-500/15 text-cyan-400',
    },
    {
      label: 'Flashs',
      value: stats.totalFlashs.toString(),
      suffix: '',
      icon: Users,
      iconBg: 'bg-amber-500/15 text-amber-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#0a0a0a] p-4 sm:p-5 flex flex-col min-h-[88px] sm:min-h-[110px]"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-xl sm:text-2xl font-display font-bold text-white tabular-nums">
                  {card.value}
                </span>
                <span className="text-zinc-500 text-sm">{card.suffix}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center gap-2 text-xs text-zinc-500">
        <TrendingUp size={14} />
        Statistiques détaillées
      </div>
    </motion.div>
  );
};
