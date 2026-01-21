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
import { Skeleton } from '../common/Skeleton';

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

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

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
  const [nextCountdown, setNextCountdown] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (!nextBooking?.date_debut) {
      setNextCountdown(null);
      return;
    }

    const tick = () => {
      const now = new Date();
      const start = new Date(nextBooking.date_debut);
      const diffMs = start.getTime() - now.getTime();
      if (diffMs <= 0) {
        setNextCountdown('Maintenant');
        return;
      }
      const totalMinutes = Math.floor(diffMs / 60000);
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      if (days > 0) return setNextCountdown(`Dans ${days}j ${hours}h`);
      if (hours > 0) return setNextCountdown(`Dans ${hours}h ${minutes}min`);
      return setNextCountdown(`Dans ${minutes} min`);
    };

    tick();
    const id = window.setInterval(tick, 60000);
    return () => window.clearInterval(id);
  }, [nextBooking?.date_debut]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Chiffre d'affaires du mois
      const { data: monthlyBookings } = await supabase
        .from('bookings')
        .select('prix_total,statut_booking')
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', startOfMonth.toISOString());

      // NOTE: nos types Supabase custom n'ont pas `Relationships` → select() infère parfois `never`.
      const monthlyBookingsSafe = (monthlyBookings as any[] | null) || [];
      const revenue = monthlyBookingsSafe.reduce((sum, b) => sum + (b.prix_total || 0), 0) || 0;
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

      // 4. Prochain RDV (le prochain, même si c'est demain)
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          flashs (title),
          projects (body_part, style)
        `)
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', now.toISOString())
        .order('date_debut', { ascending: true })
        .limit(1);

      if (todayBookings && todayBookings.length > 0) {
        setNextBooking(todayBookings[0] as Booking);
      } else {
        setNextBooking(null);
      }

      // 5. Revenus des 6 derniers mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: historicalBookings } = await supabase
        .from('bookings')
        .select('prix_total,date_debut')
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', sixMonthsAgo.toISOString());

      // Grouper par mois
      const monthlyData: { [key: string]: number } = {};
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      
      const historicalBookingsSafe = (historicalBookings as any[] | null) || [];
      historicalBookingsSafe.forEach(booking => {
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
          .select('id,client_name,created_at,statut_booking,flashs(title),projects(body_part)')
          .eq('artist_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('projects')
          .select('id,client_name,created_at,statut,body_part')
          .eq('artist_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('flashs')
          .select('id,title,created_at')
          .eq('artist_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2),
      ]);

      const activities: Activity[] = [];
      
      const recentBookingsSafe = ((recentBookings as any).data as any[] | null) || [];
      const recentProjectsSafe = ((recentProjects as any).data as any[] | null) || [];
      const recentFlashsSafe = ((recentFlashs as any).data as any[] | null) || [];

      recentBookingsSafe.forEach(booking => {
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

      recentProjectsSafe.forEach(project => {
        activities.push({
          id: project.id,
          type: 'project',
          title: `Nouveau projet: ${project.body_part}`,
          client: project.client_name || 'Client',
          date: project.created_at,
          status: project.statut,
        });
      });

      recentFlashsSafe.forEach(flash => {
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
    
    const url = `${window.location.origin}/${profile.slug_profil}`;
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
        return <Calendar className="text-emerald-400" size={16} />;
      case 'project':
        return <MessageSquare className="text-cyan-400" size={16} />;
      case 'flash':
        return <Zap className="text-amber-400" size={16} />;
      default:
        return <CheckCircle className="text-zinc-400" size={16} />;
    }
  };

  if (loading) {
    return (
      <>
        {/* Header (Desktop only) */}
        <header className="hidden md:flex h-16 border-b border-white/5 bg-[#0a0a0a] items-center justify-between px-6 z-10 flex-shrink-0">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-40" />
          </div>
        </header>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 md:p-6">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>

          {/* Actions Rapides (Mobile) */}
          <div className="md:hidden">
            <div className="flex gap-3 justify-center">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="w-14 h-14 rounded-2xl" />
            </div>
          </div>

          {/* Ma Journée */}
          <div className="glass rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                  <div className="flex items-center gap-4 pt-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique et Activité */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 glass rounded-2xl p-5 md:p-6">
              <Skeleton className="h-3 w-32 mb-5" />
              <Skeleton className="h-[180px] w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2 glass rounded-2xl p-5 md:p-6">
              <Skeleton className="h-3 w-36 mb-5" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-white/5">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-3 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header (Desktop only) */}
      <header className="hidden md:flex h-16 border-b border-white/5 bg-[#0a0a0a] items-center justify-between px-6 z-10 flex-shrink-0">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-display font-bold text-white"
        >
          Tableau de Bord
        </motion.h2>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="flex items-center gap-2 glass text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium hover:text-white transition-all"
          >
            <Share2 size={16} /> Partager mon lien
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/flashs')}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all"
          >
            <Plus size={16}/> Nouveau Flash
          </motion.button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        {/* Next Appointment (Top Widget) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-4"
        >
          <div className="glass rounded-2xl p-4 md:p-5 border border-white/5">
            {nextBooking ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Clock className="text-white" size={20} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Prochain RDV</div>
                    <div className="text-white font-semibold text-lg">
                      {nextCountdown ? `${nextCountdown}` : 'À venir'}
                      <span className="text-zinc-500 font-normal"> • </span>
                      {formatTime(nextBooking.date_debut)}
                    </div>
                    <div className="text-zinc-400 text-sm mt-0.5">
                      {nextBooking.client_name || 'Client'} —{' '}
                      {nextBooking.flash_id
                        ? `Flash: ${nextBooking.flashs?.title || 'Flash'}`
                        : `Projet: ${nextBooking.projects?.body_part || 'Projet'}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/dashboard/calendar')}
                    className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-100"
                  >
                    Voir agenda
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Prochain RDV</div>
                  <div className="text-white font-semibold">Aucun rendez‑vous à venir</div>
                  <div className="text-zinc-500 text-sm">Planifiez votre semaine depuis le calendrier.</div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard/calendar')}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10"
                >
                  Ouvrir calendrier
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* KPIs Grid */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-3 gap-3 md:gap-4 mb-6"
        >
          {/* CA Mensuel */}
          <motion.button
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/finance')}
            className="glass rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-white/10 transition-colors">
              <DollarSign className="text-zinc-400" size={20} />
            </div>
            <p className="text-xs text-zinc-500 mb-1 font-medium">CA mensuel</p>
            <p className="text-xl md:text-2xl font-display font-bold text-white">
              {Math.round(monthlyRevenue / 100).toLocaleString('fr-FR')}€
            </p>
          </motion.button>

          {/* RDV à venir */}
          <motion.button
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/calendar')}
            className="glass rounded-2xl p-4 md:p-6 hover:bg-white/10 transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-white/10 transition-colors">
              <Calendar className="text-zinc-400" size={20} />
            </div>
            <p className="text-xs text-zinc-500 mb-1 font-medium">RDV à venir</p>
            <p className="text-xl md:text-2xl font-display font-bold text-white">{upcomingBookings}</p>
          </motion.button>

          {/* Demandes */}
          <motion.button
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/requests')}
            className={`glass rounded-2xl p-4 md:p-6 transition-all text-left cursor-pointer group ${
              pendingRequests > 0 ? 'border-amber-500/30' : ''
            }`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition-colors ${
              pendingRequests > 0 ? 'bg-amber-500/10' : 'bg-white/5 group-hover:bg-white/10'
            }`}>
              <AlertCircle className={pendingRequests > 0 ? 'text-amber-400' : 'text-zinc-400'} size={20} />
            </div>
            <p className="text-xs text-zinc-500 mb-1 font-medium">Demandes</p>
            <p className="text-xl md:text-2xl font-display font-bold text-white">{pendingRequests}</p>
          </motion.button>
        </motion.div>

        {/* Actions Rapides (Mobile) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:hidden mb-6"
        >
          <div className="flex gap-3 justify-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard/flashs')}
              className="w-14 h-14 rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <Plus className="text-white" size={22} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => alert('Fonctionnalité bientôt disponible')}
              className="w-14 h-14 rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <QrCode className="text-zinc-400" size={22} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="w-14 h-14 rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <Link className="text-zinc-400" size={22} />
            </motion.button>
          </div>
        </motion.div>

        {/* Ma Journée */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="glass rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="text-zinc-500" size={16} />
                Ma Journée
              </h3>
              <button
                onClick={() => navigate('/dashboard/calendar')}
                className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                Voir tout <ArrowRight size={12} />
              </button>
            </div>

            {nextBooking ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 rounded-xl p-5 border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-display font-bold text-white mb-1">
                      {formatTime(nextBooking.date_debut)}
                    </p>
                    <p className="text-lg font-medium text-white mb-1">
                      {nextBooking.client_name || 'Client'}
                    </p>
                    <p className="text-zinc-400 text-sm mb-3">
                      {nextBooking.flash_id
                        ? `Flash: ${nextBooking.flashs?.title || 'Flash'}`
                        : `Projet: ${nextBooking.projects?.body_part || 'Projet'}`
                      }
                    </p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {nextBooking.duree_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} /> {Math.round(nextBooking.prix_total / 100)}€
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/5 rounded-xl p-8 text-center border border-white/5">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-zinc-600" size={24} />
                </div>
                <p className="text-white font-medium mb-1">Aucun RDV aujourd'hui</p>
                <p className="text-zinc-500 text-sm">Profitez-en pour dessiner ! 🎨</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Graphique et Activité */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Graphique */}
          <div className="lg:col-span-1 glass rounded-2xl p-5 md:p-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
              <TrendingUp className="text-zinc-600" size={14} />
              Revenus (6 mois)
            </h3>
            {monthlyRevenues.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyRevenues}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#52525b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#52525b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value: number) => [`${value}€`, 'Revenus']}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar dataKey="revenue" fill="#ffffff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-zinc-600">
                <p className="text-sm">Pas encore de données</p>
              </div>
            )}
          </div>

          {/* Activité Récente */}
          <div className="lg:col-span-2 glass rounded-2xl p-5 md:p-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Clock className="text-zinc-600" size={14} />
              Activité Récente
            </h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={`${activity.type}-${activity.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{activity.title}</p>
                      {activity.client && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <User size={10} /> {activity.client}
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-600 flex-shrink-0">
                      {new Date(activity.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-600">
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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl glass text-white flex items-center gap-3 text-sm font-medium"
          >
            <CheckCircle size={16} className="text-emerald-400" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-1 text-zinc-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
