'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addWeeks, subWeeks, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarSidebar, MainCalendarGrid, EventModal } from './calendar';
import { bookingsToCalendarEvents } from './calendar/calendar-utils';
import type { ViewMode, CalendarEvent } from './calendar/calendar-types';
import type { MeetingReminder } from './calendar/CalendarSidebar';
import type { CalendarBookingPayload } from '@/lib/calendar-data';

export interface CalendarViewSoftUIProps {
  /** Réservations récupérées côté serveur (Prisma) */
  initialBookings?: CalendarBookingPayload[];
}

export function CalendarViewSoftUI({ initialBookings = [] }: CalendarViewSoftUIProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const events = useMemo(
    () => bookingsToCalendarEvents(initialBookings),
    [initialBookings]
  );

  const nextReminder: MeetingReminder | null = useMemo(() => {
    const now = new Date();
    const upcoming = initialBookings
      .filter((b) => new Date(b.startTime) >= now && b.status !== 'CANCELLED')
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )[0];
    if (!upcoming) return null;
    return {
      id: upcoming.id,
      title: upcoming.clientName,
      time: format(new Date(upcoming.startTime), 'HH:mm', { locale: fr }),
      attendees: upcoming.artistName
        ? [{ name: upcoming.artistName, initials: upcoming.artistName.slice(0, 2).toUpperCase() }]
        : [],
    };
  }, [initialBookings]);

  const handlePrev = useCallback(() => {
    setCurrentDate((d) => {
      if (!d) return new Date();
      if (viewMode === 'monthly') return subMonths(d, 1);
      if (viewMode === 'weekly') return subWeeks(d, 1);
      return subDays(d, 1);
    });
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => {
      if (!d) return new Date();
      if (viewMode === 'monthly') return addMonths(d, 1);
      if (viewMode === 'weekly') return addWeeks(d, 1);
      return addDays(d, 1);
    });
  }, [viewMode]);

  const handleGoToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleCreateEvent = useCallback(() => {
    setModalEvent(null);
    setModalInitialDate(currentDate ?? undefined);
    setModalOpen(true);
  }, [currentDate]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setModalEvent(event);
    setModalInitialDate(undefined);
    setModalOpen(true);
  }, []);

  const handleModalSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  // Éviter le flash avant hydratation (dates null = skeleton)
  if (currentDate === null) {
    return (
      <div className="min-h-screen flex gap-4 p-4 pb-24 md:pb-4 animate-pulse bg-background">
        <div className="w-56 h-[600px] rounded-2xl bg-border/50" />
        <div className="flex-1 h-[600px] rounded-2xl bg-border/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex gap-4 p-4 pb-24 md:pb-4 bg-background">
      <CalendarSidebar
        currentDate={currentDate}
        onSelectDate={setCurrentDate}
        nextReminder={nextReminder}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        <MainCalendarGrid
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPrev={handlePrev}
          onNext={handleNext}
          onGoToToday={handleGoToToday}
          onCreateEvent={handleCreateEvent}
          onEventClick={handleEventClick}
          events={events}
        />
      </main>

      <EventModal
        event={modalEvent}
        initialDate={modalInitialDate}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
