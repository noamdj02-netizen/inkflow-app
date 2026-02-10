import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  AlertTriangle,
  Bell,
  CreditCard,
  MessageSquare,
  Trophy,
  Globe,
} from 'lucide-react';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { supabase } from '../../services/supabase';
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

// --- Types pour alertes ---
interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'urgent';
  icon: typeof AlertTriangle;
  message: string;
  cta: string;
  link: string;
}

// --- Types pour top clients ---
interface TopClient {
  clientName: string;
  clientEmail: string;
  totalSpent: number;
  bookingsCount: number;
}

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
  const { user } = useAuth();
  const { profile } = useArtistProfile();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // --- Alerts state ---
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // --- Top 5 Clients state ---
  const [topClients, setTopClients] = useState<TopClient[]>([]);

  // --- Client count state ---
  const [totalClients, setTotalClients] = useState<number | null>(null);

  // Fetch alerts from Supabase
  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    const newAlerts: DashboardAlert[] = [];

    try {
      // 1. Bookings confirmés sans acompte payé
      const { data: unpaidDeposits } = await supabase
        .from('bookings')
        .select('id')
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .eq('statut_paiement', 'pending');

      if (unpaidDeposits && unpaidDeposits.length > 0) {
        newAlerts.push({
          id: 'unpaid-deposits',
          type: 'warning',
          icon: CreditCard,
          message: `${unpaidDeposits.length} RDV sans acompte payé`,
          cta: 'Voir les finances',
          link: '/dashboard/finance',
        });
      }

      // 2. Demandes en attente depuis plus de 3 jours
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const { data: stalePending } = await supabase
        .from('projects')
        .select('id')
        .eq('artist_id', user.id)
        .in('statut', ['inquiry', 'pending'])
        .lt('created_at', threeDaysAgo.toISOString());

      if (stalePending && stalePending.length > 0) {
        newAlerts.push({
          id: 'stale-requests',
          type: 'urgent',
          icon: MessageSquare,
          message: `${stalePending.length} demande${stalePending.length > 1 ? 's' : ''} en attente depuis plus de 3 jours`,
          cta: 'Voir les demandes',
          link: '/dashboard/requests',
        });
      }

      // 3. RDV dans les 24 prochaines heures
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const { data: upcoming24h } = await supabase
        .from('bookings')
        .select('id')
        .eq('artist_id', user.id)
        .in('statut_booking', ['confirmed', 'pending'])
        .gte('date_debut', now.toISOString())
        .lt('date_debut', in24h.toISOString());

      if (upcoming24h && upcoming24h.length > 0) {
        const isToday = (d: Date) => {
          const t = new Date();
          return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
        };
        const label = isToday(now) ? "aujourd'hui" : 'dans les 24h';
        newAlerts.push({
          id: 'upcoming-24h',
          type: 'info',
          icon: Bell,
          message: `${upcoming24h.length} RDV prévu${upcoming24h.length > 1 ? 's' : ''} ${label}`,
          cta: 'Voir le calendrier',
          link: '/dashboard/calendar',
        });
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }

    // 4. Page publique non configurée
    if (!profile?.slug_profil) {
      newAlerts.push({
        id: 'no-public-page',
        type: 'warning',
        icon: Globe,
        message: 'Votre vitrine publique n\'est pas encore active. Configurez-la pour que vos clients puissent réserver.',
        cta: 'Configurer ma vitrine',
        link: '/dashboard/settings',
      });
    }

    setAlerts(newAlerts);
  }, [user, profile]);

  // Fetch top 5 clients
  const fetchTopClients = useCallback(async () => {
    if (!user) return;
    try {
      const { data: bookingsRaw } = await supabase
        .from('bookings')
        .select('client_email, client_name, prix_total, statut_paiement')
        .eq('artist_id', user.id)
        .in('statut_paiement', ['deposit_paid', 'fully_paid']);

      const bookingsData = bookingsRaw as { client_email: string; client_name: string | null; prix_total: number; statut_paiement: string }[] | null;

      if (!bookingsData || bookingsData.length === 0) {
        setTopClients([]);
        return;
      }

      // Agréger par client_email
      const clientMap = new Map<string, { name: string; total: number; count: number }>();
      for (const b of bookingsData) {
        const existing = clientMap.get(b.client_email) || { name: b.client_name || b.client_email, total: 0, count: 0 };
        existing.total += b.prix_total || 0;
        existing.count += 1;
        if (b.client_name && existing.name === b.client_email) existing.name = b.client_name;
        clientMap.set(b.client_email, existing);
      }

      const sorted = Array.from(clientMap.entries())
        .map(([email, data]) => ({
          clientEmail: email,
          clientName: data.name,
          totalSpent: data.total / 100, // centimes → euros
          bookingsCount: data.count,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      setTopClients(sorted);
    } catch (err) {
      console.error('Error fetching top clients:', err);
    }
  }, [user]);

  // Fetch distinct client count
  const fetchClientCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data: clientData } = await supabase
        .from('bookings')
        .select('client_email')
        .eq('artist_id', user.id);

      const typedClientData = clientData as { client_email: string }[] | null;
      if (typedClientData) {
        const uniqueEmails = new Set(typedClientData.map((b) => b.client_email));
        setTotalClients(uniqueEmails.size);
      }
    } catch (err) {
      console.error('Error fetching client count:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
    fetchTopClients();
    fetchClientCount();
  }, [fetchAlerts, fetchTopClients, fetchClientCount]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  };

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

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
        value: totalClients !== null ? String(totalClients) : '—',
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
    [stats, isDark, totalClients]
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

      {/* --- Alertes --- */}
      <AnimatePresence>
        {visibleAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {visibleAlerts.map((alert) => {
              const AlertIcon = alert.icon;
              const colorMap = {
                warning: {
                  bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
                  icon: 'text-amber-500',
                  text: isDark ? 'text-amber-300' : 'text-amber-800',
                  btn: isDark ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-700',
                },
                urgent: {
                  bg: isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200',
                  icon: 'text-red-500',
                  text: isDark ? 'text-red-300' : 'text-red-800',
                  btn: isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300' : 'bg-red-100 hover:bg-red-200 text-red-700',
                },
                info: {
                  bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
                  icon: 'text-blue-500',
                  text: isDark ? 'text-blue-300' : 'text-blue-800',
                  btn: isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-700',
                },
              };
              const colors = colorMap[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors.bg}`}
                >
                  <AlertIcon size={18} className={`shrink-0 ${colors.icon}`} />
                  <span className={`text-sm font-medium flex-1 ${colors.text}`}>{alert.message}</span>
                  <button
                    onClick={() => navigate(alert.link)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${colors.btn}`}
                  >
                    {alert.cta}
                  </button>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}
                    title="Masquer"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* --- Top 5 Clients --- */}
      {topClients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={`rounded-2xl p-6 ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Top 5 Clients
              </h3>
              <p className="text-sm text-gray-500">Par chiffre d'affaires généré</p>
            </div>
          </div>

          <div className="space-y-4">
            {(() => {
              const maxSpent = topClients[0]?.totalSpent || 1;
              return topClients.map((client, index) => {
                const percentage = (client.totalSpent / maxSpent) * 100;
                const rankColors = [
                  'from-amber-400 to-yellow-500',
                  'from-gray-300 to-gray-400',
                  'from-orange-400 to-amber-500',
                  'from-violet-400 to-purple-500',
                  'from-blue-400 to-cyan-500',
                ];
                return (
                  <div key={client.clientEmail} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br ${rankColors[index]} text-white text-xs font-bold shrink-0`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {client.clientName}
                          </p>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {client.bookingsCount} RDV
                            </span>
                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatRevenue(client.totalSpent)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-10">
                      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.9 + index * 0.1, duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${rankColors[index]}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </motion.div>
      )}
    </div>
  );
};
