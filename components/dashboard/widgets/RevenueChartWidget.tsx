/**
 * Revenue Chart Widget
 * 
 * Displays monthly revenue chart for the last 6 months.
 * Uses Suspense for streaming - loads independently.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../hooks/useAuth';

// Note: Recharts is lazy loaded because this widget is lazy loaded via App.tsx
// This saves ~150KB from the initial bundle

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export const RevenueChartWidget: React.FC = () => {
  const { user } = useAuth();
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchRevenueData();
  }, [user]);

  const fetchRevenueData = async () => {
    if (!user) return;

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data } = await supabase
        .from('bookings')
        .select('prix_total,date_debut')
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', sixMonthsAgo.toISOString());

      // Group by month
      const monthlyData: { [key: string]: number } = {};
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

      ((data as any[]) || []).forEach((booking) => {
        const date = new Date(booking.date_debut);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (booking.prix_total || 0);
      });

      // Create last 6 months
      const revenues: MonthlyRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        revenues.push({
          month: monthNames[date.getMonth()],
          revenue: Math.round((monthlyData[monthKey] || 0) / 100),
        });
      }

      setMonthlyRevenues(revenues);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-white/10"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-48" />
          <div className="h-64 bg-white/10 rounded" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-400/10 rounded-lg">
            <TrendingUp className="text-emerald-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Revenus (6 mois)</h3>
            <p className="text-sm text-zinc-400">Évolution mensuelle</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyRevenues}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="month"
            stroke="#a1a1aa"
            style={{ fontSize: '12px' }}
          />
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
            formatter={(value: number) => [`${value}€`, 'Revenus']}
          />
          <Bar
            dataKey="revenue"
            fill="url(#colorGradient)"
            radius={[8, 8, 0, 0]}
          />
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
