/**
 * Revenue Chart Widget – SWR cache, ChartSkeleton, error fallback.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useRevenueChartSWR } from '../../../hooks/useDashboardSWR';
import { ChartSkeleton, WidgetErrorFallback } from './WidgetSkeleton';

export const RevenueChartWidget: React.FC = () => {
  const { monthlyRevenues, loading, error, refresh } = useRevenueChartSWR();

  if (loading && (!monthlyRevenues || monthlyRevenues.length === 0)) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <WidgetErrorFallback
        message="Le graphique des revenus n'a pas pu être chargé."
        onRetry={() => refresh()}
      />
    );
  }

  // Null safety : données vides ou undefined
  const chartData = monthlyRevenues ?? [];
  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-4 h-full min-h-0 flex flex-col items-center justify-center border border-border bg-card shadow-soft-light dark:shadow-soft-dark"
      >
        <h3 className="text-sm font-semibold text-foreground mb-2">Revenus (6 mois)</h3>
        <p className="text-sm text-foreground-muted">Pas de données</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-4 h-full min-h-0 flex flex-col border border-border bg-card shadow-soft-light dark:shadow-soft-dark"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <TrendingUp className="text-dash-primary" size={16} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Revenus (6 mois)</h3>
            <p className="text-xs text-foreground-muted">Évolution mensuelle</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#1e293b',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0}€`, 'Revenus']}
          />
          <Bar dataKey="revenue" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
