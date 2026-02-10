/**
 * Next Appointment Widget
 * 
 * Displays the next upcoming appointment with countdown.
 * Uses Suspense for streaming - loads independently.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../hooks/useAuth';
import type { Database } from '../../../types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  flashs?: { title: string } | null;
  projects?: { body_part: string; style: string } | null;
};

export const NextAppointmentWidget: React.FC = () => {
  const { user } = useAuth();
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [nextCountdown, setNextCountdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNextBooking();
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

  const fetchNextBooking = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const { data } = await supabase
        .from('bookings')
        .select(`
          id,
          client_name,
          date_debut,
          date_fin,
          flash_id,
          project_id,
          flashs (title),
          projects (body_part, style)
        `)
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .gte('date_debut', now.toISOString())
        .order('date_debut', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setNextBooking(data as Booking);
      }
    } catch (error) {
      console.error('Error fetching next booking:', error);
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
          <div className="h-4 bg-white/10 rounded w-32" />
          <div className="h-8 bg-white/10 rounded w-48" />
          <div className="h-4 bg-white/10 rounded w-24" />
        </div>
      </motion.div>
    );
  }

  if (!nextBooking) {
    return null;
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const title = nextBooking.flash_id
    ? nextBooking.flashs?.title || 'Flash'
    : `${nextBooking.projects?.body_part || 'Projet'} • ${nextBooking.projects?.style || ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-400/10 rounded-lg">
            <Clock className="text-amber-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400">Prochain RDV</h3>
            {nextCountdown && (
              <p className="text-lg font-semibold text-white mt-1">{nextCountdown}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white">
          <Calendar size={16} className="text-zinc-400" />
          <span className="font-medium">{nextBooking.client_name || 'Client'}</span>
        </div>
        <p className="text-sm text-zinc-400">{title}</p>
        <p className="text-xs text-zinc-500">
          {new Date(nextBooking.date_debut).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}{' '}
          à {formatTime(nextBooking.date_debut)}
        </p>
      </div>
    </motion.div>
  );
};
