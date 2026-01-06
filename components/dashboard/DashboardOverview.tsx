import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  DollarSign, Calendar, AlertCircle, Clock, TrendingUp, Plus, Share2, 
  ArrowRight, Loader2, CheckCircle, MessageSquare, Zap, User
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
    if (!profile?.slug_profil) return;
    
    const url = `${window.location.origin}/p/${profile.slug_profil}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.nom_studio} - InkFlow`,
          text: `Découvrez mes flashs disponibles`,
          url: url,
        });
      } catch (err) {
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
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
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <TrendingUp className="text-amber-400" size={20}/> 
            Tableau de Bord
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Share2 size={16} /> Partager mon lien
          </button>
          <button
            onClick={() => navigate('/dashboard/flashs')}
            className="flex items-center gap-2 bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-300 shadow-lg shadow-amber-400/20"
          >
            <Plus size={16}/> Nouveau Flash
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* CA Mensuel */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="text-amber-400" size={24} />
              </div>
              <TrendingUp className="text-amber-400" size={20} />
            </div>
            <div className="mb-2">
              <p className="text-sm text-slate-400 mb-1">Chiffre d'affaires</p>
              <p className="text-3xl font-black text-white">
                {Math.round(monthlyRevenue / 100).toLocaleString('fr-FR')}€
              </p>
            </div>
            <p className="text-xs text-slate-500">Ce mois-ci</p>
          </div>

          {/* RDV à venir */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="text-blue-400" size={24} />
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-slate-400 mb-1">RDV à venir</p>
              <p className="text-3xl font-black text-white">{upcomingBookings}</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/calendar')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
            >
              Voir le calendrier <ArrowRight size={12} />
            </button>
          </div>

          {/* Demandes en attente */}
          <div className={`rounded-2xl p-6 border ${
            pendingRequests > 0
              ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30'
              : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                pendingRequests > 0 ? 'bg-red-500/20' : 'bg-green-500/20'
              }`}>
                <AlertCircle className={pendingRequests > 0 ? 'text-red-400' : 'text-green-400'} size={24} />
              </div>
            </div>
            <div className="mb-2">
              <p className="text-sm text-slate-400 mb-1">Demandes en attente</p>
              <p className={`text-3xl font-black ${
                pendingRequests > 0 ? 'text-white' : 'text-white'
              }`}>
                {pendingRequests}
              </p>
            </div>
            {pendingRequests > 0 && (
              <button
                onClick={() => navigate('/dashboard/requests')}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-2"
              >
                Traiter maintenant <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Aujourd'hui - Large */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="text-amber-400" size={20} />
                Aujourd'hui
              </h3>
              <button
                onClick={() => navigate('/dashboard/calendar')}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                Voir tout <ArrowRight size={14} />
              </button>
            </div>

            {nextBooking ? (
              <div className="bg-slate-900/50 rounded-xl p-6 border border-amber-400/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-amber-400/20 rounded-xl flex items-center justify-center">
                        <Clock className="text-amber-400" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">
                          {formatTime(nextBooking.date_debut)}
                        </p>
                        <p className="text-sm text-slate-400">Prochain RDV</p>
                      </div>
                    </div>
                    <div className="ml-16">
                      <p className="text-lg font-bold text-white mb-1">
                        {nextBooking.client_name || 'Client'}
                      </p>
                      <p className="text-slate-400">
                        {nextBooking.flash_id
                          ? `Flash: ${nextBooking.flashs?.title || 'Flash'}`
                          : `Projet: ${nextBooking.projects?.body_part || 'Projet'} • ${nextBooking.projects?.style || ''}`
                        }
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
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
              </div>
            ) : (
              <div className="bg-slate-900/50 rounded-xl p-12 text-center border border-slate-700">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-slate-500" size={32} />
                </div>
                <p className="text-lg font-bold text-white mb-2">Aucun RDV prévu aujourd'hui</p>
                <p className="text-slate-400">Profitez-en pour dessiner ! 🎨</p>
              </div>
            )}
          </div>

          {/* Graphique - Medium */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-amber-400" size={20} />
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
          <div className="lg:col-span-3 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="text-amber-400" size={20} />
              Activité Récente
            </h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={`${activity.type}-${activity.id}-${index}`}
                    className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
