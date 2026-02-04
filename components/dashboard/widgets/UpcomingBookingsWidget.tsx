/**
 * RDV de la semaine – Tous les rendez-vous d'aujourd'hui et de la semaine à venir.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock } from 'lucide-react';
import { useDashboardDataSWR } from '../../../hooks/useDashboardSWR';
import { WidgetErrorFallback } from './WidgetSkeleton';

export const UpcomingBookingsWidget: React.FC = () => {
  const { recentBookings, loading, error, refresh } = useDashboardDataSWR();

  if (loading && recentBookings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-white/10"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/10 rounded w-full" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <WidgetErrorFallback
        message="Les rendez-vous n'ont pas pu être chargés."
        onRetry={() => refresh()}
      />
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d >= today && d < tomorrow) return "Aujourd'hui";
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    if (d >= tomorrow && d < dayAfter) return 'Demain';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-400/10 rounded-lg">
          <CalendarDays className="text-cyan-400" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-zinc-400">RDV de la semaine</h3>
          <p className="text-lg font-semibold text-white mt-0.5">
            {recentBookings.length} rendez-vous
          </p>
        </div>
      </div>

      {recentBookings.length === 0 ? (
        <p className="text-center py-8 text-zinc-500 text-sm">Aucun rendez-vous à venir</p>
      ) : (
        <div className="space-y-3">
          {recentBookings.slice(0, 5).map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <Clock size={16} className="text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{b.client_name || 'Client'}</p>
                <p className="text-xs text-zinc-500">
                  {formatDate(b.date_debut)} à {formatTime(b.date_debut)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
