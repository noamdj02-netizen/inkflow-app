/**
 * Vue semaine : grille 7 jours × heures avec disponibilités et RDV, actions au survol.
 */
import React, { useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDisponibilites } from '../../hooks/useDisponibilites';
import { useCalendar, type CalendarEventInput } from '../../hooks/useCalendar';
import { slotKey } from '../../hooks/useDisponibilites';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Lundi = 0 */
function dayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function getStartOfWeek(anyDay: Date): Date {
  const d = new Date(anyDay);
  d.setDate(d.getDate() - dayOfWeek(anyDay));
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface WeekViewProps {
  /** Un jour quelconque de la semaine à afficher */
  currentWeek: Date;
  onAddSlot?: (dayIndex: number, hour: number) => void;
  onEditEvent?: (event: CalendarEventInput) => void;
  onDeleteEvent?: (event: CalendarEventInput) => void;
  onEventClick?: (event: CalendarEventInput) => void;
  className?: string;
}

interface TimeCellProps {
  dayIndex: number;
  hour: number;
  isAvailable: boolean;
  appointment: CalendarEventInput | null;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onEventClick?: () => void;
}

function TimeCell({
  dayIndex,
  hour,
  isAvailable,
  appointment,
  onAdd,
  onEdit,
  onDelete,
  onEventClick,
}: TimeCellProps) {
  return (
    <div
      className={
        'min-h-[60px] p-1.5 relative group border-b border-r border-white/5 last:border-r-0 ' +
        (isAvailable ? 'bg-emerald-500/10' : 'bg-zinc-900/50')
      }
    >
      {appointment && (
        <button
          type="button"
          onClick={onEventClick}
          className="w-full text-left rounded-lg px-2 py-1.5 bg-purple-500/20 border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
        >
          <p className="text-xs font-medium text-white truncate">
            {appointment.extendedProps?.clientName || 'Client'}
          </p>
          <p className="text-[10px] text-zinc-400">
            {appointment.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {appointment.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </button>
      )}

      <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center gap-1 bg-black/30 transition-opacity rounded pointer-events-none group-hover/cell:pointer-events-auto">
        {!appointment && isAvailable && onAdd && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="min-h-[32px] px-2 py-1.5 rounded-lg text-xs font-medium bg-white/95 text-black flex items-center gap-1.5 shadow-lg hover:bg-white"
          >
            <Plus size={14} />
            Ajouter
          </button>
        )}
        {appointment && (onEdit || onDelete) && (
          <span className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg bg-white/95 text-zinc-700 hover:bg-white shadow-lg"
                aria-label="Modifier"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg bg-red-500/90 text-white hover:bg-red-500 shadow-lg"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export function WeekView({
  currentWeek,
  onAddSlot,
  onEditEvent,
  onDeleteEvent,
  onEventClick,
  className = '',
}: WeekViewProps) {
  const { user } = useAuth();
  const artistId = user?.id ?? undefined;
  const { disponibilites, hourStart, hourEnd } = useDisponibilites();
  const { events } = useCalendar(artistId);

  const startOfWeek = useMemo(() => getStartOfWeek(currentWeek), [currentWeek]);
  const endOfWeek = useMemo(() => {
    const e = new Date(startOfWeek);
    e.setDate(e.getDate() + 7);
    return e;
  }, [startOfWeek]);

  const eventsInWeek = useMemo(() => {
    const start = startOfWeek.getTime();
    const end = endOfWeek.getTime();
    return events.filter((ev) => {
      const t = ev.start.getTime();
      return t >= start && t < end;
    });
  }, [events, startOfWeek, endOfWeek]);

  const eventsByCell = useMemo(() => {
    const map: Record<string, CalendarEventInput> = {};
    for (const ev of eventsInWeek) {
      const day = dayOfWeek(ev.start);
      const hour = ev.start.getHours();
      const key = slotKey(day, hour);
      if (!map[key]) map[key] = ev;
    }
    return map;
  }, [eventsInWeek]);

  const hours = Array.from(
    { length: hourEnd - hourStart },
    (_, i) => hourStart + i
  );

  return (
    <div
      className={
        'grid grid-cols-8 gap-px bg-white/10 rounded-xl overflow-hidden ' + className
      }
    >
      <div className="bg-[#0a0a0a] p-2 rounded-tl-xl" />
      {DAY_LABELS.map((label, i) => (
        <div
          key={i}
          className="bg-[#0a0a0a] p-2 text-center text-sm font-semibold text-white rounded-tr-xl last:rounded-tr-xl"
        >
          {label}
        </div>
      ))}

      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className="bg-[#0a0a0a] p-2 text-sm text-zinc-500 text-right flex items-center justify-end pr-2">
            {hour}:00
          </div>
          {DAY_LABELS.map((_, dayIndex) => {
            const key = slotKey(dayIndex, hour);
            const isAvailable = disponibilites[key] === true;
            const appointment = eventsByCell[key] ?? null;
            return (
              <div key={key} className="group/cell relative">
                <TimeCell
                  dayIndex={dayIndex}
                  hour={hour}
                  isAvailable={isAvailable}
                  appointment={appointment}
                  onAdd={
                    onAddSlot
                      ? () => onAddSlot(dayIndex, hour)
                      : undefined
                  }
                  onEdit={
                    appointment && onEditEvent
                      ? () => onEditEvent(appointment)
                      : undefined
                  }
                  onDelete={
                    appointment && onDeleteEvent
                      ? () => onDeleteEvent(appointment)
                      : undefined
                  }
                  onEventClick={
                    appointment && onEventClick
                      ? () => onEventClick(appointment)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
