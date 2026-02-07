/**
 * Next Appointment Widget – SWR cache, skeleton, error fallback.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNextBookingSWR } from '../../../hooks/useDashboardSWR';
import { WidgetErrorFallback } from './WidgetSkeleton';
import { ClientOnly, DatePlaceholder } from '../../ClientDate';

export const NextAppointmentWidget: React.FC = () => {
  const { nextBooking, loading, error, refresh } = useNextBookingSWR();
  const [nextCountdown, setNextCountdown] = useState<string | null>(null);

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
      if (days > 0) setNextCountdown(`Dans ${days}j ${hours}h`);
      else if (hours > 0) setNextCountdown(`Dans ${hours}h ${minutes}min`);
      else setNextCountdown(`Dans ${minutes} min`);
    };
    tick();
    const id = window.setInterval(tick, 60000);
    return () => window.clearInterval(id);
  }, [nextBooking?.date_debut]);

  if (loading && !nextBooking) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-32" />
          <div className="h-8 bg-white/10 rounded w-48" />
          <div className="h-4 bg-white/10 rounded w-24" />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <WidgetErrorFallback
        message="Le prochain RDV n'a pas pu être chargé."
        onRetry={() => refresh()}
      />
    );
  }

  if (!nextBooking) {
    return null;
  }

  const formatTime = (dateString: string) =>
    format(new Date(dateString), 'HH:mm', { locale: fr });
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
            {nextCountdown && <p className="text-lg font-semibold text-white mt-1">{nextCountdown}</p>}
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
          <ClientOnly fallback={<DatePlaceholder />}>
            {format(new Date(nextBooking.date_debut), 'EEEE d MMMM', { locale: fr })}{' '}
            à {formatTime(nextBooking.date_debut)}
          </ClientOnly>
        </p>
      </div>
    </motion.div>
  );
};
