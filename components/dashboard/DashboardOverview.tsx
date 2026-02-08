import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  DollarSign,
  Image,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Booking } from '../../types/supabase';

// Données mock pour le graphique revenus (6 mois) - à remplacer par des données réelles si l'API fournit une série mensuelle
const defaultRevenueData = [
  { month: 'Jan', revenue: 0, orders: 0 },
  { month: 'Fév', revenue: 0, orders: 0 },
  { month: 'Mar', revenue: 0, orders: 0 },
  { month: 'Avr', revenue: 0, orders: 0 },
  { month: 'Mai', revenue: 0, orders: 0 },
  { month: 'Jun', revenue: 0, orders: 0 },
];

const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatRevenue(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function getRevenueChartData(totalRevenue: number): { month: string; revenue: number; orders: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const month = monthLabels[d.getMonth()];
    const rev = i === 5 ? totalRevenue : Math.round((totalRevenue * (i + 1)) / 6);
    return { month, revenue: rev, orders: 0 };
  });
}

export const DashboardOverview: React.FC = () => {
  const { theme } = useDashboardTheme();
  const { stats, recentBookings, loading } = useDashboardData();
  const isDark = theme === 'dark';

  const revenueChartData = useMemo(
    () => (stats.totalRevenue > 0 ? getRevenueChartData(stats.totalRevenue) : defaultRevenueData),
    [stats.totalRevenue]
  );

  const appointmentPieData = useMemo(() => {
    const confirmed = recentBookings.filter((b) => b.statut_booking === 'confirmed').length;
    const pending = recentBookings.filter((b) => b.statut_booking === 'pending').length;
    const cancelled = recentBookings.filter((b) => b.statut_booking === 'cancelled').length;
    return [
      { name: 'Confirmés', value: confirmed || 0, color: '#8b5cf6' },
      { name: 'En attente', value: pending || 0, color: '#f59e0b' },
      { name: 'Annulés', value: cancelled || 0, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [recentBookings]);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  const upcomingToday = useMemo(
    () =>
      recentBookings.filter((b) => {
        const d = b.date_debut ? new Date(b.date_debut).toISOString() : '';
        return d >= today.start && d < today.end;
      }),
    [recentBookings, today]
  );

  const statsCards = useMemo(
    () => [
      {
        title: 'Revenu Total',
        value: formatRevenue(stats.totalRevenue),
        change: '—',
        trend: 'up' as const,
        icon: DollarSign,
        gradient: 'from-violet-500 to-purple-600',
        bgGradient: isDark ? 'from-violet-500/10 to-purple-600/10' : 'from-violet-50 to-purple-50',
      },
      {
        title: 'Total Clients',
        value: '—',
        change: '—',
        trend: 'up' as const,
        icon: Users,
        gradient: 'from-blue-500 to-cyan-600',
        bgGradient: isDark ? 'from-blue-500/10 to-cyan-600/10' : 'from-blue-50 to-cyan-50',
      },
      {
        title: 'RDV à venir',
        value: String(stats.upcomingBookings),
        change: '—',
        trend: 'up' as const,
        icon: Calendar,
        gradient: 'from-emerald-500 to-teal-600',
        bgGradient: isDark ? 'from-emerald-500/10 to-teal-600/10' : 'from-emerald-50 to-teal-50',
      },
      {
        title: 'Flashs vendus',
        value: String(stats.totalFlashs),
        change: '—',
        trend: 'up' as const,
        icon: Image,
        gradient: 'from-orange-500 to-amber-600',
        bgGradient: isDark ? 'from-orange-500/10 to-amber-600/10' : 'from-orange-50 to-amber-50',
      },
    ],
    [stats, isDark]
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: string; icon: typeof CheckCircle2 }
    > = {
      confirmed: {
        label: 'Confirmé',
        color: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
        icon: CheckCircle2,
      },
      pending: {
        label: 'En attente',
        color: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
        icon: Clock,
      },
      in_progress: {
        label: 'En cours',
        color: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
        icon: AlertCircle,
      },
      completed: {
        label: 'Terminé',
        color: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
        icon: CheckCircle2,
      },
      cancelled: {
        label: 'Annulé',
        color: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
        icon: XCircle,
      },
      rejected: {
        label: 'Refusé',
        color: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
        icon: XCircle,
      },
      no_show: {
        label: 'Absent',
        color: isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-50 text-gray-600',
        icon: XCircle,
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return '—';
    const a = new Date(start).getTime();
    const b = new Date(end).getTime();
    const min = Math.round((b - a) / 60000);
    if (min < 60) return `${min}min`;
    return `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className={`h-9 w-48 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-5 w-64 mt-2 rounded ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 h-36 animate-pulse ${isDark ? 'bg-[#1a1a2e]' : 'bg-white border border-gray-200'}`}
            />
          ))}
        </div>
        <div className={`rounded-2xl p-6 h-80 animate-pulse ${isDark ? 'bg-[#1a1a2e]' : 'bg-white border border-gray-200'}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-2xl p-6 ${
                isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} rounded-full blur-3xl opacity-50`} />
              <div className="relative">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <Icon size={24} className="text-white" />
                </div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <div className="flex items-end justify-between">
                  <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </h3>
                  {stat.change !== '—' && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {stat.change}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`xl:col-span-2 rounded-2xl p-6 ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Évolution du Revenu
              </h3>
              <p className="text-sm text-gray-500">6 derniers mois</p>
            </div>
            <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
              <MoreVertical size={20} className="text-gray-500" />
            </button>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#00000010'} />
              <XAxis dataKey="month" stroke={isDark ? '#666' : '#999'} style={{ fontSize: '12px' }} />
              <YAxis stroke={isDark ? '#666' : '#999'} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a2e' : '#fff',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  color: isDark ? '#fff' : '#000',
                }}
                formatter={(value: number) => [formatRevenue(value), 'Revenu']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-2xl p-6 ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Rendez-vous
              </h3>
              <p className="text-sm text-gray-500">Répartition (à venir)</p>
            </div>
          </div>

          {appointmentPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={appointmentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {appointmentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {appointmentPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={`h-[200px] flex items-center justify-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Aucun RDV à venir
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`xl:col-span-2 rounded-2xl overflow-hidden ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <div className={`p-6 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Clients récents (RDV à venir)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`px-6 py-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Aucun rendez-vous à venir
                    </td>
                  </tr>
                ) : (
                  recentBookings.slice(0, 5).map((b: Booking) => (
                    <tr key={b.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {b.client_name || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {b.date_debut ? new Date(b.date_debut).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {b.prix_total != null ? formatRevenue(b.prix_total / 100) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(b.statut_booking)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`rounded-2xl p-6 ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Rendez-vous du jour
          </h3>

          <div className="space-y-4">
            {upcomingToday.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Aucun créneau aujourd'hui.</p>
            ) : (
              upcomingToday.map((apt: Booking) => (
                <div
                  key={apt.id}
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{apt.client_name || '—'}</p>
                      <p className="text-sm text-gray-500">RDV</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-violet-500/10 text-violet-400 rounded-lg">
                      {formatTime(apt.date_debut)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    {formatDuration(apt.date_debut, apt.date_fin)}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
