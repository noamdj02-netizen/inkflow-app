/**
 * Recent Activity Widget
 * 
 * Displays recent activity (bookings, projects, flashs).
 * Uses Suspense for streaming - loads independently.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Zap, CheckCircle } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface Activity {
  id: string;
  type: 'booking' | 'project' | 'flash';
  title: string;
  client?: string;
  date: string;
  status?: string;
}

export const RecentActivityWidget: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchRecentActivity();
  }, [user]);

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
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

      const allActivities: Activity[] = [];

      ((recentBookings as any).data as any[] || []).forEach((booking) => {
        allActivities.push({
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

      ((recentProjects as any).data as any[] || []).forEach((project) => {
        allActivities.push({
          id: project.id,
          type: 'project',
          title: `Nouveau projet: ${project.body_part}`,
          client: project.client_name || 'Client',
          date: project.created_at,
          status: project.statut,
        });
      });

      ((recentFlashs as any).data as any[] || []).forEach((flash) => {
        allActivities.push({
          id: flash.id,
          type: 'flash',
          title: `Flash créé: ${flash.title}`,
          date: flash.created_at,
        });
      });

      // Sort by date and take top 5
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(allActivities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Il y a moins d\'une heure';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/10 rounded" />
          ))}
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
      <h3 className="text-lg font-semibold text-white mb-4">Activité récente</h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Aucune activité récente</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{activity.title}</p>
                {activity.client && (
                  <p className="text-xs text-zinc-400 mt-1">{activity.client}</p>
                )}
                <p className="text-xs text-zinc-500 mt-1">{formatDate(activity.date)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
