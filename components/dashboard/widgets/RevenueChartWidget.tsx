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

  if (loading && monthlyRevenues.length === 0) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-400/10 rounded-lg">
            <TrendingUp className="text-emerald-400" size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Revenus (6 mois)</h3>
            <p className="text-xs text-zinc-400">Évolution mensuelle</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={monthlyRevenues}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" stroke="#a1a1aa" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#a1a1aa"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0}€`, 'Revenus']}
          />
          <Bar dataKey="revenue" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
