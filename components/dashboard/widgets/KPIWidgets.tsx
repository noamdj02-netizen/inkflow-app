/**
 * KPI Widgets – bloc Statistiques (CA du mois, RDV à venir, En attente).
 * Mise en page propre : 3 cartes alignées, même hauteur.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import { useKPIsSWR } from '../../../hooks/useDashboardSWR';
import { KPISkeleton, WidgetErrorFallback } from './WidgetSkeleton';

export const KPIWidgets: React.FC = () => {
  const { kpis, loading, error, refresh } = useKPIsSWR();

  if (loading && kpis.upcomingBookings === 0 && kpis.pendingRequests === 0 && kpis.monthlyRevenue === 0) {
    return <KPISkeleton />;
  }

  if (error) {
    return (
      <WidgetErrorFallback
        message="Les indicateurs n'ont pas pu être chargés."
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
      trend: '+12%',
    },
    {
      label: 'RDV à venir',
      value: kpis.upcomingBookings.toString(),
      suffix: '',
      icon: Calendar,
      iconBg: 'bg-cyan-500/15 text-cyan-400',
      trend: null,
    },
    {
      label: 'En attente',
      value: kpis.pendingRequests.toString(),
      suffix: '',
      icon: MessageSquare,
      iconBg: 'bg-amber-500/15 text-amber-400',
      trend: null,
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
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-xl sm:text-2xl font-display font-bold text-white tabular-nums">
                  {card.value}
                </span>
                {card.suffix && (
                  <span className="text-sm font-medium text-zinc-400">{card.suffix}</span>
                )}
              </div>
              {card.trend && (
                <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-emerald-400">
                  <TrendingUp size={12} />
                  <span>{card.trend}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
