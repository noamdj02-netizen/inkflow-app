/**
 * Vue d’un seul jour : en-tête date + liste des RDV du jour (mobile).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface DayViewEvent {
  id: string;
  start: Date;
  end: Date;
  title?: string;
  booking?: {
    client_name?: string | null;
    flashs?: { title?: string; prix?: number } | null;
    projects?: { body_part?: string } | null;
  };
  type: 'flash' | 'project';
}

export interface DayViewProps {
  date: Date;
  events: DayViewEvent[];
  onEventClick?: (event: DayViewEvent) => void;
  emptyMessage?: string;
  className?: string;
}

export function DayView({
  date,
  events,
  onEventClick,
  emptyMessage = 'Aucun rendez-vous ce jour-là',
  className = '',
}: DayViewProps) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.start), date));
  const isToday = isSameDay(date, new Date());

  return (
    <div className={`flex flex-col h-full min-h-[280px] ${className}`}>
      <header className="shrink-0 py-4 text-center border-b border-white/10">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-full mt-2 text-lg font-bold ${
            isToday ? 'bg-white text-black' : 'bg-white/10 text-white'
          }`}
        >
          {date.getDate()}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
              <Calendar className="text-zinc-500" size={24} />
            </div>
            <p className="text-zinc-500 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          dayEvents.map((event, idx) => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            return (
              <motion.button
                key={event.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onEventClick?.(event)}
                className={`w-full text-left rounded-xl p-4 min-h-[72px] border-l-4 transition-colors touch-manipulation active:scale-[0.99] ${
                  event.type === 'flash'
                    ? 'bg-brand-purple/10 border-brand-purple hover:bg-brand-purple/20'
                    : 'bg-white/5 border-brand-cyan hover:bg-white/10 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`text-xs font-medium ${event.type === 'flash' ? 'text-brand-purple' : 'text-brand-cyan'}`}>
                    {event.type === 'flash' ? '⚡ Flash' : '🎨 Projet'}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    {format(start, 'HH:mm', { locale: fr })} – {format(end, 'HH:mm', { locale: fr })}
                  </span>
                </div>
                <p className="font-semibold text-white text-sm">
                  {event.booking?.flashs?.title || event.booking?.projects?.body_part || 'Rendez-vous'}
                </p>
                <p className="text-zinc-500 text-sm">{event.booking?.client_name || 'Client'}</p>
                {event.booking?.flashs?.prix != null && (
                  <p className="text-brand-mint text-sm font-medium mt-1">
                    {Math.round(event.booking.flashs.prix / 100).toLocaleString('fr-FR')}€
                  </p>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
