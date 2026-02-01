/**
 * KPI Widgets – SWR cache, KPISkeleton, error fallback.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
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

  const kpiCards = [
    {
      label: 'CA du mois',
      value: `${kpis.monthlyRevenue.toLocaleString('fr-FR')} €`,
      icon: DollarSign,
      color: 'emerald',
      trend: '+12%',
    },
    {
      label: 'RDV à venir',
      value: kpis.upcomingBookings.toString(),
      icon: Calendar,
      color: 'cyan',
    },
    {
      label: 'En attente',
      value: kpis.pendingRequests.toString(),
      icon: AlertCircle,
      color: 'amber',
    },
  ];

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-400/10 text-emerald-400',
    cyan: 'bg-cyan-400/10 text-cyan-400',
    amber: 'bg-amber-400/10 text-amber-400',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-2">{kpi.label}</p>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                {kpi.trend && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                    <TrendingUp size={12} />
                    <span>{kpi.trend}</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg ${colorClasses[kpi.color]}`}>
                <Icon size={20} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
