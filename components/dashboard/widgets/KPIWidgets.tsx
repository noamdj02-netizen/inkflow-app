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
      iconBg: 'bg-emerald-100 text-dash-success',
      trend: '+12%',
      trendColor: 'text-dash-success',
    },
    {
      label: 'RDV à venir',
      value: kpis.upcomingBookings.toString(),
      suffix: '',
      icon: Calendar,
      iconBg: 'bg-blue-100 text-dash-info',
      trend: null,
      trendColor: '',
    },
    {
      label: 'En attente',
      value: kpis.pendingRequests.toString(),
      suffix: '',
      icon: MessageSquare,
      iconBg: 'bg-amber-100 text-dash-warning',
      trend: null,
      trendColor: '',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden border border-border bg-card shadow-soft-light dark:shadow-soft-dark"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card p-4 sm:p-5 flex flex-col min-h-[88px] sm:min-h-[110px]"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                  <Icon size={16} strokeWidth={1.8} />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                  {card.value}
                </span>
                {card.suffix && (
                  <span className="text-sm font-medium text-foreground-muted">{card.suffix}</span>
                )}
              </div>
              {card.trend && (
                <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${card.trendColor}`}>
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
