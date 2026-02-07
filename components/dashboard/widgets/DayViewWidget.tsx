/**
 * Widget "Vue Journée" – mini timeline des créneaux du jour.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNextBookingSWR } from '../../../hooks/useDashboardSWR';
import { ClientOnly, DatePlaceholder } from '../../ClientDate';

export const DayViewWidget: React.FC = () => {
  const { nextBooking, loading } = useNextBookingSWR();
  const bookingIsToday = nextBooking?.date_debut
    ? isToday(new Date(nextBooking.date_debut))
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={18} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-white">Vue Journée</h3>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/10 rounded-xl" />
            ))}
          </div>
        ) : nextBooking && bookingIsToday ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">
                <ClientOnly fallback={<DatePlaceholder />}>
                  {format(new Date(nextBooking.date_debut), 'HH:mm', { locale: fr })}
                </ClientOnly>
              </div>
              <div className="text-xs text-zinc-400 truncate">
                {nextBooking.client_name ?? 'Client'} • Prochain RDV
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-zinc-500">
            Aucun créneau prévu aujourd&apos;hui dans la timeline.
          </div>
        )}
      </div>
    </motion.div>
  );
};
