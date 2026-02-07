'use client';

import React from 'react';
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  setHours,
  isSameDay,
  isWithinInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode, CalendarEvent } from './calendar-types';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 h - 20 h
const EVENT_COLORS: Record<CalendarEvent['color'], string> = {
  pink: 'bg-pink-100 dark:bg-pink-500/20 text-pink-900 dark:text-pink-200 border-l-4 border-pink-500',
  blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 border-l-4 border-blue-500',
  purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-900 dark:text-purple-200 border-l-4 border-purple-500',
  orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-900 dark:text-orange-200 border-l-4 border-orange-500',
  teal: 'bg-teal-100 dark:bg-teal-500/20 text-teal-900 dark:text-teal-200 border-l-4 border-teal-500',
  red: 'bg-red-100 dark:bg-red-500/20 text-red-900 dark:text-red-200 border-l-4 border-red-500',
  gray: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 border-l-4 border-gray-400 dark:border-gray-500',
};

export interface MainCalendarGridProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  /** Ramène à la date du jour */
  onGoToToday?: () => void;
  onCreateEvent: () => void;
  /** Clic sur un événement (ouvrir détail / édition) */
  onEventClick?: (event: CalendarEvent) => void;
  /** Événements à afficher (ex. réservations Prisma converties) */
  events?: CalendarEvent[];
  className?: string;
}

export function MainCalendarGrid({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onGoToToday,
  onCreateEvent,
  onEventClick,
  events = [],
  className,
}: MainCalendarGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays =
    viewMode === 'daily'
      ? [currentDate]
      : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayLabel =
    viewMode === 'monthly'
      ? format(currentDate, 'MMMM yyyy', { locale: fr })
      : format(currentDate, 'EEEE d MMMM yyyy', { locale: fr });
  const gridStartMinutes = 8 * 60;
  const totalMinutes = 12 * 60; // 12 h (8h–20h)

  const eventsInRange = events.filter((ev) =>
    weekDays.some((d) => isSameDay(d, ev.start))
  );
  const columnCount = weekDays.length;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const eventsInMonth = events.filter((ev) =>
    isWithinInterval(ev.start, { start: monthStart, end: monthEnd })
  );

  return (
    <div className={cn('flex flex-col flex-1 min-w-0', className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-foreground-muted hover:bg-card hover:shadow-sm border border-border transition-colors dark:hover:bg-zinc-800"
            aria-label="Précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-foreground capitalize min-w-[220px]">
            {dayLabel}
          </h2>
          <button
            type="button"
            onClick={onNext}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-foreground-muted hover:bg-card hover:shadow-sm border border-border transition-colors dark:hover:bg-zinc-800"
            aria-label="Suivant"
          >
            <ChevronRight size={20} />
          </button>
          {onGoToToday && (
            <button
              type="button"
              onClick={onGoToToday}
              className="px-3 py-2 rounded-xl text-sm font-medium text-foreground-muted hover:bg-background border border-border transition-colors dark:hover:bg-zinc-800"
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Segment control: Daily | Weekly | Monthly */}
          <div className="inline-flex p-1 rounded-2xl bg-background/50 border border-border">
            {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize',
                  viewMode === mode
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                {mode === 'daily' ? 'Jour' : mode === 'weekly' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onCreateEvent}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-300 hover:bg-amber-400 text-amber-950 dark:bg-amber-500/30 dark:hover:bg-amber-500/50 dark:text-amber-100 font-semibold text-sm shadow-sm transition-colors"
          >
            <Plus size={18} strokeWidth={2.5} />
            Nouveau RDV
          </button>
        </div>
      </div>

      {/* Vue Mois : liste des événements du mois */}
      {viewMode === 'monthly' && (
        <div className="bg-card text-foreground rounded-3xl border border-border shadow-sm overflow-hidden p-6 min-h-[32rem]">
          <p className="text-sm text-foreground-muted mb-4">
            {eventsInMonth.length} rendez-vous ce mois
          </p>
          <ul className="space-y-3">
            {eventsInMonth
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .map((event) => (
                <li
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onEventClick?.(event)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onEventClick?.(event);
                    }
                  }}
                  className={cn(
                    'rounded-2xl border border-border px-4 py-3 text-sm shadow-sm cursor-pointer hover:shadow-md transition-shadow',
                    EVENT_COLORS[event.color],
                    onEventClick && 'hover:ring-2 hover:ring-primary/30'
                  )}
                >
                  <p className="font-semibold truncate">{event.title}</p>
                  <p className="text-xs mt-0.5 opacity-90">
                    {format(event.start, 'EEEE d MMMM · HH:mm', { locale: fr })} –{' '}
                    {format(event.end, 'HH:mm', { locale: fr })}
                  </p>
                  {event.artistName && (
                    <p className="text-xs mt-1 opacity-75">{event.artistName}</p>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Grille horaire - Vue Jour / Semaine */}
      {viewMode !== 'monthly' && (
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden" style={{ height: '52rem' }}>
        <div className="grid grid-cols-[64px_1fr] h-full">
          {/* Hour labels */}
          <div className="flex flex-col border-r border-border">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 flex items-start justify-end pr-2 pt-0.5 text-xs text-foreground-muted font-medium"
              >
                {format(setHours(new Date(0), hour), 'HH')} h
              </div>
            ))}
          </div>

          {/* Days columns (1 en vue Jour, 7 en vue Semaine) */}
          <div
            className="grid relative h-full"
            style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
          >
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="border-r border-border last:border-r-0"
              >
                {HOURS.map((hour) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="h-16 border-b border-border"
                  />
                ))}
              </div>
            ))}

            {/* Event blocks - positioned absolutely */}
            {eventsInRange.map((event) => {
              const dayIndex = weekDays.findIndex((d) =>
                isSameDay(d, event.start)
              );
              if (dayIndex < 0) return null;
              const startMinutes =
                event.start.getHours() * 60 + event.start.getMinutes();
              const endMinutes =
                event.end.getHours() * 60 + event.end.getMinutes();
              const gridEndMinutes = 20 * 60;
              const effectiveStart = Math.max(startMinutes, gridStartMinutes);
              const effectiveEnd = Math.min(endMinutes, gridEndMinutes);
              if (effectiveEnd <= effectiveStart) return null;
              const topPct =
                ((effectiveStart - gridStartMinutes) / totalMinutes) * 100;
              const heightPct =
                ((effectiveEnd - effectiveStart) / totalMinutes) * 100;
              const left = (dayIndex / columnCount) * 100;
              const width = 100 / columnCount;

              return (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onEventClick?.(event)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onEventClick?.(event);
                    }
                  }}
                  className={cn(
                    'absolute rounded-xl border border-border px-2 py-1.5 overflow-hidden',
                    'text-xs font-medium shadow-sm',
                    EVENT_COLORS[event.color],
                    onEventClick && 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary/30 transition-shadow'
                  )}
                  style={{
                    top: `${topPct}%`,
                    left: `${left}%`,
                    width: `calc(${width}% - 4px)`,
                    height: `${Math.max(heightPct, 1.5)}%`,
                    minHeight: '28px',
                    marginLeft: '2px',
                    marginRight: '2px',
                  }}
                >
                  <p className="truncate">{event.title}</p>
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex -space-x-1.5 mt-1">
                      {event.attendees.slice(0, 3).map((a) => (
                        <div
                          key={a.name}
                          className="w-5 h-5 rounded-full bg-card/80 dark:bg-card/90 border border-border flex items-center justify-center text-[10px] font-semibold"
                          title={a.name}
                        >
                          {a.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
