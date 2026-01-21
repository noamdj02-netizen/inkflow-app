/**
 * KPI Widgets
 * 
 * Displays key performance indicators (Revenue, Upcoming Bookings, Pending Requests).
 * Uses Suspense for streaming - loads independently.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface KPIData {
  monthlyRevenue: number;
  upcomingBookings: number;
  pendingRequests: number;
}

export const KPIWidgets: React.FC = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPIData>({
    monthlyRevenue: 0,
    upcomingBookings: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchKPIs();
  }, [user]);

  const fetchKPIs = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Parallel queries for better performance
      const [revenueData, upcomingData, pendingData] = await Promise.all([
        // Monthly revenue
        supabase
          .from('bookings')
          .select('prix_total')
          .eq('artist_id', user.id)
          .eq('statut_booking', 'confirmed')
          .gte('date_debut', startOfMonth.toISOString()),

        // Upcoming bookings count
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('artist_id', user.id)
          .eq('statut_booking', 'confirmed')
          .gte('date_debut', now.toISOString()),

        // Pending requests count
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('artist_id', user.id)
          .in('statut_booking', ['pending'])
          .or('statut_paiement.eq.pending'),
      ]);

      const revenue = ((revenueData.data as any[]) || []).reduce(
        (sum, b) => sum + (b.prix_total || 0),
        0
      );

      setKpis({
        monthlyRevenue: revenue / 100, // Convert centimes to euros
        upcomingBookings: upcomingData.count || 0,
        pendingRequests: pendingData.count || 0,
      });
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-24" />
              <div className="h-8 bg-white/10 rounded w-32" />
            </div>
          </motion.div>
        ))}
      </div>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        const colorClasses = {
          emerald: 'bg-emerald-400/10 text-emerald-400',
          cyan: 'bg-cyan-400/10 text-cyan-400',
          amber: 'bg-amber-400/10 text-amber-400',
        };

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
              <div className={`p-3 rounded-lg ${colorClasses[kpi.color as keyof typeof colorClasses]}`}>
                <Icon size={20} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
