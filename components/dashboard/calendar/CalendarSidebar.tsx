'use client';

import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDown, Check, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FilterOption, MeetingReminder } from './calendar-types';

const DEFAULT_FILTERS: FilterOption[] = [
  { id: 'meetings', label: 'Réunions', checked: true },
  { id: 'deadlines', label: 'Échéances', checked: true },
  { id: 'tasks', label: 'Tâches', checked: false },
  { id: 'personal', label: 'Personnel', checked: true },
];

export interface CalendarSidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  /** Prochain RDV pour la carte "Rappel" (optionnel) */
  nextReminder?: MeetingReminder | null;
  className?: string;
}

export type { MeetingReminder };

export function CalendarSidebar({
  currentDate,
  onSelectDate,
  nextReminder = null,
  className,
}: CalendarSidebarProps) {
  const [month, setMonth] = useState(currentDate);
  const [filters, setFilters] = useState<FilterOption[]>(DEFAULT_FILTERS);
  const [otherCalOpen, setOtherCalOpen] = useState(true);
  const reminder = nextReminder ?? {
    id: 'placeholder',
    title: 'Rappel',
    time: '—',
    attendees: [],
  };

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const toggleFilter = (id: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f))
    );
  };

  return (
    <aside
      className={cn(
        'w-[350px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto',
        className
      )}
    >
      {/* Mini Calendar */}
      <div className="bg-card text-foreground rounded-3xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-xl text-foreground-muted hover:bg-background hover:text-foreground transition-colors dark:hover:bg-zinc-800"
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-foreground capitalize">
            {format(month, 'MMMM yyyy', { locale: fr })}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-xl text-foreground-muted hover:bg-background hover:text-foreground transition-colors dark:hover:bg-zinc-800"
            aria-label="Mois suivant"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-[10px] font-medium text-foreground-muted py-1"
            >
              {day}
            </div>
          ))}
          {days.map((day) => {
            const sameMonth = isSameMonth(day, month);
            const selected = isSameDay(day, currentDate);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(day)}
                className={cn(
                  'aspect-square rounded-xl text-xs font-medium transition-colors',
                  !sameMonth && 'text-foreground-muted/50',
                  sameMonth && 'text-foreground',
                  selected && 'bg-primary text-white',
                  !selected && sameMonth && today && 'bg-background/50 dark:bg-zinc-700',
                  !selected && sameMonth && !today && 'hover:bg-background dark:hover:bg-zinc-800'
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Carte Rappel (Teal / primary) */}
      <div className="bg-primary rounded-2xl p-4 text-white shadow-sm">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-sm">{reminder.title}</h3>
            <p className="text-xs text-white/90 mt-0.5">{reminder.time}</p>
          </div>
          {nextReminder && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Accepter"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Refuser"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        {reminder.attendees.length > 0 && (
          <div className="flex items-center gap-2">
            <Users size={14} className="text-white/80" />
            <div className="flex -space-x-2">
              {reminder.attendees.map((a) => (
                <div
                  key={a.name}
                  className="w-7 h-7 rounded-full bg-white/30 border-2 border-primary flex items-center justify-center text-xs font-medium"
                  title={a.name}
                >
                  {a.initials}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-card text-foreground rounded-3xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Filtrer</h3>
        <ul className="space-y-2">
          {filters.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={f.checked}
                  onChange={() => toggleFilter(f.id)}
                  className="sr-only peer"
                />
                <div
                  className={cn(
                    'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors',
                    f.checked
                      ? 'bg-primary border-primary'
                      : 'border-border group-hover:border-foreground-muted'
                  )}
                >
                  {f.checked && <Check size={12} className="text-white" />}
                </div>
              </div>
              <span className="text-sm text-foreground">{f.label}</span>
            </label>
          ))}
        </ul>
      </div>

      {/* Autres agendas */}
      <div className="bg-card text-foreground rounded-3xl overflow-hidden shadow-sm border border-border">
        <button
          type="button"
          onClick={() => setOtherCalOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-background/50 transition-colors dark:hover:bg-zinc-800/50"
        >
          <h3 className="text-sm font-semibold text-foreground">
            Mes agendas
          </h3>
          <ChevronDown
            size={18}
            className={cn(
              'text-foreground-muted transition-transform',
              otherCalOpen && 'rotate-180'
            )}
          />
        </button>
        {otherCalOpen && (
          <div className="px-4 pb-4 pt-0 border-t border-border">
            <p className="text-xs text-foreground-muted pt-3">
              Aucun autre calendrier pour le moment.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
