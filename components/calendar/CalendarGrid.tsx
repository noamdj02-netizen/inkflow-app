/**
 * Calendrier avec drag & drop natif (FullCalendar).
 * Feedback : toast loading/success/error + confetti en cas de succès.
 */
import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import type { EventDropArg, EventResizeArg } from '@fullcalendar/core';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { useCalendar } from '../../hooks/useCalendar';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../common/Skeleton';

export interface CalendarGridProps {
  className?: string;
  height?: string | number;
  /** Vue initiale : timeGridWeek, timeGridDay, dayGridMonth */
  initialView?: string;
}

export function CalendarGrid({ className = '', height = 'auto', initialView = 'timeGridWeek' }: CalendarGridProps) {
  const { user } = useAuth();
  const artistId = user?.id ?? undefined;
  const {
    events,
    loading,
    refetch,
    checkSlotAvailability,
    updateAppointment,
  } = useCalendar(artistId);

  const fullCalendarEvents = useMemo(() => events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    extendedProps: e.extendedProps,
  })), [events]);

  const handleDrop = async (info: EventDropArg) => {
    const toastId = toast.loading('Déplacement en cours...');
    try {
      const start = info.event.start;
      const end = info.event.end;
      if (!start || !end) {
        info.revert();
        toast.error('❌ Créneau invalide', { id: toastId });
        return;
      }

      const result = await checkSlotAvailability(info.event.id, start, end);
      if (!result.available) {
        info.revert();
        toast.error(result.reason ?? '❌ Créneau indisponible', { id: toastId });
        return;
      }

      await updateAppointment(info.event.id, { start, end });
      refetch();

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      toast.success('✅ RDV déplacé !', { id: toastId });
    } catch (err) {
      info.revert();
      const msg = err instanceof Error ? err.message : 'Erreur lors du déplacement';
      toast.error(msg, { id: toastId });
    }
  };

  const handleResize = async (info: EventResizeArg) => {
    const toastId = toast.loading('Modification en cours...');
    try {
      const start = info.event.start;
      const end = info.event.end;
      if (!start || !end) {
        info.revert();
        toast.error('❌ Créneau invalide', { id: toastId });
        return;
      }

      const result = await checkSlotAvailability(info.event.id, start, end);
      if (!result.available) {
        info.revert();
        toast.error(result.reason ?? '❌ Créneau indisponible', { id: toastId });
        return;
      }

      await updateAppointment(info.event.id, { start, end });
      refetch();

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
      toast.success('✅ Durée mise à jour !', { id: toastId });
    } catch (err) {
      info.revert();
      const msg = err instanceof Error ? err.message : 'Erreur lors de la modification';
      toast.error(msg, { id: toastId });
    }
  };

  if (!artistId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-xl border border-white/10 bg-white/5 p-8 text-center ${className}`}
      >
        <p className="text-zinc-400">Connectez-vous pour voir le calendrier.</p>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`calendar-wrap ${className}`}
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        locale={frLocale}
        initialView={initialView}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        editable
        droppable
        eventDrop={handleDrop}
        eventResize={handleResize}
        events={fullCalendarEvents}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:15:00"
        height={height}
        eventDisplay="block"
        nowIndicator
        dayMaxEvents={false}
        navLinks
        buttonText={{
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
        }}
        // Style cohérent thème sombre
        themeSystem="standard"
        eventClassNames="fc-event-custom"
      />
      <style>{`
        .calendar-wrap .fc {
          --fc-border-color: rgba(255,255,255,0.1);
          --fc-button-bg-color: rgba(255,255,255,0.08);
          --fc-button-border-color: rgba(255,255,255,0.1);
          --fc-button-hover-bg-color: rgba(255,255,255,0.12);
          --fc-button-active-bg-color: rgba(255,255,255,0.15);
          --fc-today-bg-color: rgba(255,255,255,0.04);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(255,255,255,0.03);
          --fc-list-event-hover-bg-color: rgba(255,255,255,0.06);
          --fc-event-bg-color: rgba(168,85,247,0.4);
          --fc-event-border-color: rgba(168,85,247,0.6);
        }
        .calendar-wrap .fc-toolbar-title { font-size: 1.25rem; color: #fff; }
        .calendar-wrap .fc-col-header-cell-cushion,
        .calendar-wrap .fc-timegrid-slot-label { color: rgba(255,255,255,0.7); }
        .calendar-wrap .fc-timegrid-slot { min-height: 2.5rem; }
        .calendar-wrap .fc-event-custom { cursor: move; border-radius: 6px; }
      `}</style>
    </motion.div>
  );
}
