import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  DollarSign, Calendar, AlertCircle, Clock, TrendingUp, Plus, Share2, 
  ArrowRight, Loader2, CheckCircle, MessageSquare, Zap, User, X, Link, QrCode
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
  interface Activity {
    id: string;
    type: 'booking' | 'project' | 'flash';
    title: string;
    client?: string;
    date: string;
    status?: string;
  }
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
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

      const activities: Activity[] = [];
      
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
        return <Calendar className="text-green-400" size={16} />;
      case 'project':
        return <MessageSquare className="text-blue-400" size={16} />;
      case 'flash':
        return <Zap className="text-amber-400" size={16} />;
      default:
        return <CheckCircle className="text-slate-400" size={16} />;
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
      {/* Header (Desktop only - Mobile header is in DashboardLayout) */}
      <header className="hidden md:flex h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm items-center justify-between px-6 z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-bold text-white"
          >
            Tableau de Bord
          </motion.h2>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex items-center gap-2 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 hover:shadow-lg transition-all"
          >
            <Share2 size={16} /> Partager mon lien
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/flashs')}
            className="flex items-center gap-2 bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-300 shadow-lg shadow-amber-400/20 transition-all"
          >
            <Plus size={16}/> Nouveau Flash
          </motion.button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6 pt-3 md:pt-6">
        {/* KPIs Horizontal Scroll (Mobile) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="md:hidden mb-6"
        >
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-3 px-3">
            {/* CA Mensuel */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/finance')}
              className="flex-shrink-0 w-44 h-36 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/50 rounded-2xl p-4 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/20 transition-all text-left cursor-pointer snap-start backdrop-blur-sm"
            >
              <DollarSign className="text-amber-400 mb-2" size={18} />
              <p className="text-xs text-amber-200/80 mb-1 font-medium">Chiffre d'affaires</p>
              <p className="text-xl font-bold text-white leading-tight">
                {Math.round(monthlyRevenue / 100).toLocaleString('fr-FR')}€
              </p>
              <p className="text-[10px] text-amber-200/60 mt-1">Ce mois-ci</p>
            </motion.button>

            {/* RDV à venir */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/calendar')}
              className="flex-shrink-0 w-44 h-36 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/50 rounded-2xl p-4 hover:border-blue-500/70 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-left cursor-pointer snap-start backdrop-blur-sm"
            >
              <Calendar className="text-blue-400 mb-2" size={18} />
              <p className="text-xs text-blue-200/80 mb-1 font-medium">RDV à venir</p>
              <p className="text-xl font-bold text-white leading-tight">{upcomingBookings}</p>
              <p className="text-[10px] text-blue-200/60 mt-1">Confirmés</p>
            </motion.button>

            {/* Demandes en attente */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/requests')}
              className={`flex-shrink-0 w-44 h-36 rounded-2xl p-4 transition-all text-left cursor-pointer snap-start backdrop-blur-sm ${
                pendingRequests > 0
                  ? 'bg-gradient-to-br from-red-500/20 to-orange-600/20 border border-red-500/50 hover:border-red-500/70 hover:shadow-lg hover:shadow-red-500/20'
                  : 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/50 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-500/20'
              }`}
            >
              <AlertCircle className={`mb-2 ${pendingRequests > 0 ? 'text-red-400' : 'text-emerald-400'}`} size={18} />
              <p className={`text-xs mb-1 font-medium ${pendingRequests > 0 ? 'text-red-200/80' : 'text-emerald-200/80'}`}>Demandes</p>
              <p className="text-xl font-bold text-white leading-tight">{pendingRequests}</p>
              <p className={`text-[10px] mt-1 ${pendingRequests > 0 ? 'text-red-200/60' : 'text-emerald-200/60'}`}>
                {pendingRequests > 0 ? 'En attente' : 'Tout est OK'}
              </p>
            </motion.button>
          </div>
        </motion.div>

        {/* KPIs Grid (Desktop) */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 mb-6">
          {/* CA Mensuel */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/finance')}
            className="bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/50 rounded-2xl p-6 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/20 transition-all text-left cursor-pointer backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="text-amber-400" size={24} />
              </div>
              <TrendingUp className="text-amber-400" size={20} />
            </div>
            <p className="text-sm text-amber-200/80 mb-1 font-medium">Chiffre d'affaires</p>
            <p className="text-3xl font-bold text-white">
              {Math.round(monthlyRevenue / 100).toLocaleString('fr-FR')}€
            </p>
            <p className="text-xs text-amber-200/60 mt-1">Ce mois-ci</p>
          </motion.button>

          {/* RDV à venir */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/calendar')}
            className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/50 rounded-2xl p-6 hover:border-blue-500/70 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-left cursor-pointer backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="text-blue-400" size={24} />
              </div>
            </div>
            <p className="text-sm text-blue-200/80 mb-1 font-medium">RDV à venir</p>
            <p className="text-3xl font-bold text-white">{upcomingBookings}</p>
            <button
              onClick={() => navigate('/dashboard/calendar')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
            >
              Voir le calendrier <ArrowRight size={12} />
            </button>
          </motion.button>

          {/* Demandes en attente */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/requests')}
            className={`rounded-2xl p-6 border transition-all text-left cursor-pointer backdrop-blur-sm ${
              pendingRequests > 0
                ? 'bg-gradient-to-br from-red-500/20 to-orange-600/20 border-red-500/50 hover:border-red-500/70 hover:shadow-lg hover:shadow-red-500/20'
                : 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-500/50 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                pendingRequests > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'
              }`}>
                <AlertCircle className={pendingRequests > 0 ? 'text-red-400' : 'text-emerald-400'} size={24} />
              </div>
            </div>
            <p className={`text-sm mb-1 font-medium ${pendingRequests > 0 ? 'text-red-200/80' : 'text-emerald-200/80'}`}>Demandes en attente</p>
            <p className="text-3xl font-bold text-white">{pendingRequests}</p>
            {pendingRequests > 0 && (
              <div className="text-xs text-red-400 flex items-center gap-1 mt-2">
                Traiter maintenant <ArrowRight size={12} />
              </div>
            )}
          </motion.button>
        </div>

        {/* Actions Rapides (Mobile) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="md:hidden mb-6"
        >
          <div className="flex gap-3 justify-center">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate('/dashboard/flashs')}
              className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center hover:bg-amber-400/20 hover:shadow-lg hover:shadow-amber-400/20 transition-all"
              title="Créer Flash"
            >
              <Plus className="text-amber-400" size={24} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => alert('Fonctionnalité bientôt disponible')}
              className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
              title="Scan QR"
            >
              <QrCode className="text-blue-400" size={24} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleShare}
              className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center hover:bg-purple-500/20 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
              title="Lien"
            >
              <Link className="text-purple-400" size={24} />
            </motion.button>
          </div>
        </motion.div>

        {/* Ma Journée - Focus Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <Clock className="text-amber-400" size={18} />
                Ma Journée
              </h3>
              <button
                onClick={() => navigate('/dashboard/calendar')}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                Voir tout <ArrowRight size={14} />
              </button>
            </div>

            {nextBooking ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/50 rounded-xl p-4 md:p-6 border border-amber-400/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 md:gap-3 mb-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-400/20 rounded-xl flex items-center justify-center">
                        <Clock className="text-amber-400" size={20} />
                      </div>
                      <div>
                        <p className="text-xl md:text-2xl font-bold text-white">
                          {formatTime(nextBooking.date_debut)}
                        </p>
                        <p className="text-xs md:text-sm text-slate-400">Prochain RDV</p>
                      </div>
                    </div>
                    <div className="ml-12 md:ml-16">
                      <p className="text-lg md:text-xl font-bold text-white mb-2">
                        {nextBooking.client_name || 'Client'}
                      </p>
                      <p className="text-slate-300 mb-3">
                        {nextBooking.flash_id
                          ? `Flash: ${nextBooking.flashs?.title || 'Flash'}`
                          : `Projet: ${nextBooking.projects?.body_part || 'Projet'} • ${nextBooking.projects?.style || ''}`
                        }
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {nextBooking.duree_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} /> {Math.round(nextBooking.prix_total / 100)}€
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/50 rounded-xl p-8 md:p-12 text-center border border-slate-700"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-slate-500" size={24} />
                </div>
                <p className="text-base md:text-lg font-bold text-white mb-2">Aucun RDV prévu aujourd'hui</p>
                <p className="text-sm md:text-base text-slate-400">Profitez-en pour dessiner ! 🎨</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Graphique et Activité - Desktop Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4"
        >
          {/* Graphique - Medium */}
          <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
            <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2">
              <TrendingUp className="text-amber-400" size={18} />
              Revenus (6 mois)
            </h3>
            {monthlyRevenues.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyRevenues}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}€`, 'Revenus']}
                  />
                  <Bar dataKey="revenue" fill="#fbbf24" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500">
                <p className="text-sm">Pas encore de données</p>
              </div>
            )}
          </div>

          {/* Activité Récente - Full Width */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
            <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2">
              <Clock className="text-amber-400" size={18} />
              Activité Récente
            </h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={`${activity.type}-${activity.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-slate-600 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium mb-1">{activity.title}</p>
                      {activity.client && (
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <User size={12} /> {activity.client}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(activity.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </motion.div>
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
