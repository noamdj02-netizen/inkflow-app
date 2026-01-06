import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  DollarSign, Calendar, AlertCircle, Clock, TrendingUp, Plus, Share2, 
  ArrowRight, Loader2, CheckCircle, MessageSquare, Zap, User, X
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import type { Database } from '../../types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  flashs?: {
    title: string;
  } | null;
  projects?: {
    body_part: string;
    style: string;
  } | null;
};

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useArtistProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // KPIs
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  
  // Aujourd'hui
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  
  // Graphique
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([]);
  
  // Activité récente
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59);

      // 1. Chiffre d'affaires du mois
      const { data: monthlyBookings } = await supabase
        .from('bookings')
        .select('prix_total, statut_booking')
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', startOfMonth.toISOString());

      const revenue = monthlyBookings?.reduce((sum, b) => sum + (b.prix_total || 0), 0) || 0;
      setMonthlyRevenue(revenue);

      // 2. RDV à venir
      const { count: upcomingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', now.toISOString());

      setUpcomingBookings(upcomingCount || 0);

      // 3. Demandes en attente
      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', user.id)
        .in('statut_booking', ['pending'])
        .or('statut_paiement.eq.pending');

      setPendingRequests(pendingCount || 0);

      // 4. Prochain RDV aujourd'hui
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          flashs (title),
          projects (body_part, style)
        `)
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', startOfDay.toISOString())
        .lte('date_debut', endOfDay.toISOString())
        .order('date_debut', { ascending: true })
        .limit(1);

      if (todayBookings && todayBookings.length > 0) {
        setNextBooking(todayBookings[0] as Booking);
      }

      // 5. Revenus des 6 derniers mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: historicalBookings } = await supabase
        .from('bookings')
        .select('prix_total, date_debut')
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', sixMonthsAgo.toISOString());

      // Grouper par mois
      const monthlyData: { [key: string]: number } = {};
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      
      historicalBookings?.forEach(booking => {
        const date = new Date(booking.date_debut);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (booking.prix_total || 0);
      });

      // Créer les 6 derniers mois
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

      // 6. Activité récente (dernières 5 actions)
      const [recentBookings, recentProjects, recentFlashs] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, client_name, created_at, statut_booking, flashs(title), projects(body_part)')
          .eq('artist_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('projects')
          .select('id, client_name, created_at, statut, body_part')
          .eq('artist_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('flashs')
          .select('id, title, created_at')
          .eq('artist_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2),
      ]);

      const activities: any[] = [];
      
      recentBookings.data?.forEach(booking => {
        activities.push({
          id: booking.id,
          type: 'booking',
          title: booking.flashs?.title 
            ? `Réservation Flash: ${booking.flashs.title}`
            : `Projet: ${booking.projects?.body_part}`,
          client: booking.client_name || 'Client',
          date: booking.created_at,
          status: booking.statut_booking,
        });
      });

      recentProjects.data?.forEach(project => {
        activities.push({
          id: project.id,
          type: 'project',
          title: `Nouveau projet: ${project.body_part}`,
          client: project.client_name || 'Client',
          date: project.created_at,
          status: project.statut,
        });
      });

      recentFlashs.data?.forEach(flash => {
        activities.push({
          id: flash.id,
          type: 'flash',
          title: `Flash créé: ${flash.title}`,
          date: flash.created_at,
        });
      });

      // Trier par date et prendre les 5 plus récents
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!profile?.slug_profil || typeof window === 'undefined') return;
    
    const url = `${window.location.origin}/p/${profile.slug_profil}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${profile.nom_studio} - InkFlow`,
          text: `Découvrez mes flashs disponibles`,
          url: url,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setToast('Lien copié !');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      // Si l'utilisateur annule le partage ou erreur, on copie quand même si possible
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(url);
          setToast('Lien copié !');
          setTimeout(() => setToast(null), 3000);
        } catch (clipboardErr) {
          console.error('Failed to copy to clipboard:', clipboardErr);
        }
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="text-yellow-500/60" size={14} />;
      case 'project':
        return <MessageSquare className="text-slate-400" size={14} />;
      case 'flash':
        return <Zap className="text-yellow-500/60" size={14} />;
      default:
        return <CheckCircle className="text-slate-500" size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-4 z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-light tracking-tight text-white">
            <span className="hidden sm:inline">Tableau de Bord</span>
            <span className="sm:hidden">Dashboard</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="hidden md:flex items-center gap-1.5 border border-white/10 text-slate-400 px-3 py-1.5 rounded-md text-xs font-light hover:bg-white/5 hover:text-white transition-colors"
          >
            <Share2 size={14} /> Partager
          </button>
          <button
            onClick={() => navigate('/dashboard/flashs')}
            className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-yellow-500/20 transition-colors"
          >
            <Plus size={14}/> <span className="hidden sm:inline">Flash</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-20 md:pb-4">
        {/* KPIs Horizontal Scroll (Mobile) */}
        <div className="md:hidden mb-4">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-3 px-3">
            {/* CA Mensuel */}
            <button
              onClick={() => navigate('/dashboard/finance')}
              className="flex-shrink-0 w-32 h-32 bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-yellow-500/20 transition-colors text-left cursor-pointer snap-start backdrop-blur-sm"
            >
              <DollarSign className="text-yellow-500/60 mb-2" size={16} />
              <p className="text-xs text-slate-500 mb-1 font-light">CA</p>
              <p className="text-xl font-light text-white leading-tight">
                {Math.round(monthlyRevenue / 100).toLocaleString('fr-FR')}€
              </p>
            </button>

            {/* RDV à venir */}
            <button
              onClick={() => navigate('/dashboard/calendar')}
              className="flex-shrink-0 w-32 h-32 bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors text-left cursor-pointer snap-start backdrop-blur-sm"
            >
              <Calendar className="text-slate-400 mb-2" size={16} />
              <p className="text-xs text-slate-500 mb-1 font-light">RDV</p>
              <p className="text-xl font-light text-white leading-tight">{upcomingBookings}</p>
            </button>

            {/* Demandes en attente */}
            <button
              onClick={() => navigate('/dashboard/requests')}
              className={`flex-shrink-0 w-32 h-32 bg-zinc-900/50 border rounded-xl p-4 transition-colors text-left cursor-pointer snap-start backdrop-blur-sm ${
                pendingRequests > 0
                  ? 'border-red-500/20 hover:border-red-500/30'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <AlertCircle className={`mb-2 ${pendingRequests > 0 ? 'text-red-500/60' : 'text-slate-400'}`} size={16} />
              <p className="text-xs text-slate-500 mb-1 font-light">En attente</p>
              <p className="text-xl font-light text-white leading-tight">{pendingRequests}</p>
            </button>
          </div>
        </div>

        {/* KPIs Grid (Desktop) */}
        <div className="hidden md:grid md:grid-cols-3 gap-3 mb-4">
          {/* CA Mensuel */}
          <button
            onClick={() => navigate('/dashboard/finance')}
            className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-yellow-500/20 transition-colors text-left cursor-pointer backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="text-yellow-500/60" size={18} />
            </div>
            <p className="text-xs text-slate-500 mb-1 font-light">Chiffre d'affaires</p>
            <p className="text-2xl font-light text-white">
              {Math.round(monthlyRevenue / 100).toLocaleString('fr-FR')}€
            </p>
          </button>

          {/* RDV à venir */}
          <button
            onClick={() => navigate('/dashboard/calendar')}
            className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors text-left cursor-pointer backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <Calendar className="text-slate-400" size={18} />
            </div>
            <p className="text-xs text-slate-500 mb-1 font-light">RDV à venir</p>
            <p className="text-2xl font-light text-white">{upcomingBookings}</p>
          </button>

          {/* Demandes en attente */}
          <button
            onClick={() => navigate('/dashboard/requests')}
            className={`bg-zinc-900/50 border rounded-xl p-4 transition-colors text-left cursor-pointer backdrop-blur-sm ${
              pendingRequests > 0
                ? 'border-red-500/20 hover:border-red-500/30'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <AlertCircle className={pendingRequests > 0 ? 'text-red-500/60' : 'text-slate-400'} size={18} />
            </div>
            <p className="text-xs text-slate-500 mb-1 font-light">Demandes en attente</p>
            <p className="text-2xl font-light text-white">{pendingRequests}</p>
          </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Aujourd'hui - Large */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-light text-slate-400 uppercase tracking-wider">
                Aujourd'hui
              </h3>
              <button
                onClick={() => navigate('/dashboard/calendar')}
                className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                Tout voir <ArrowRight size={12} />
              </button>
            </div>

            {nextBooking ? (
              <div className="bg-zinc-950/50 rounded-lg p-4 border border-yellow-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="text-yellow-500/80" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-lg font-light text-white">
                        {formatTime(nextBooking.date_debut)}
                      </p>
                      <span className="text-xs text-slate-500 font-light">Prochain RDV</span>
                    </div>
                    <p className="text-sm font-medium text-white mb-1">
                      {nextBooking.client_name || 'Client'}
                    </p>
                    <p className="text-xs text-slate-400 mb-2">
                      {nextBooking.flash_id
                        ? nextBooking.flashs?.title || 'Flash'
                        : `${nextBooking.projects?.body_part || 'Projet'} • ${nextBooking.projects?.style || ''}`
                      }
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{nextBooking.duree_minutes} min</span>
                      <span>•</span>
                      <span>{Math.round(nextBooking.prix_total / 100)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/30 rounded-lg p-8 text-center border border-white/5">
                <Calendar className="text-slate-600 mx-auto mb-3" size={24} />
                <p className="text-sm font-light text-slate-400 mb-1">Aucun RDV aujourd'hui</p>
                <p className="text-xs text-slate-500">Profitez-en pour dessiner</p>
              </div>
            )}
          </div>

          {/* Graphique - Medium */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-xs font-light text-slate-400 uppercase tracking-wider mb-4">
              Revenus (6 mois)
            </h3>
            {monthlyRevenues.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyRevenues}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#71717a"
                    fontSize={10}
                    tick={{ fill: '#71717a' }}
                  />
                  <YAxis 
                    stroke="#71717a"
                    fontSize={10}
                    tick={{ fill: '#71717a' }}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}€`, 'Revenus']}
                  />
                  <Bar dataKey="revenue" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-slate-600">
                <p className="text-xs font-light">Pas de données</p>
              </div>
            )}
          </div>

          {/* Activité Récente - Full Width */}
          <div className="lg:col-span-3 bg-zinc-900/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-xs font-light text-slate-400 uppercase tracking-wider mb-3">
              Activité Récente
            </h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div
                    key={`${activity.type}-${activity.id}-${index}`}
                    className="flex items-start gap-3 p-3 bg-zinc-950/30 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-zinc-900/50 border border-white/5 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light text-white mb-0.5">{activity.title}</p>
                      {activity.client && (
                        <p className="text-xs text-slate-500 font-light">
                          {activity.client}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-1 font-light">
                        {new Date(activity.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-600">
                <p className="text-xs font-light">Aucune activité</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg bg-zinc-900/95 border border-white/10 backdrop-blur-md text-white flex items-center gap-2 text-sm font-light"
          >
            <CheckCircle size={16} className="text-yellow-500/80" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-1">
              <X size={14} className="text-slate-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
