import type { CalendarEvent } from './calendar-types';
import type { CalendarBookingPayload } from '@/lib/calendar-data';

/** Couleur selon le statut Prisma BookingStatus */
function statusToColor(status: string): CalendarEvent['color'] {
  switch (status) {
    case 'CONFIRMED':
      return 'teal';
    case 'PENDING_PAYMENT':
      return 'orange';
    case 'CANCELLED':
      return 'red';
    case 'COMPLETED':
      return 'gray';
    default:
      return 'blue';
  }
}

/**
 * Transforme les réservations Prisma (payload sérialisé) en événements calendrier.
 */
export function bookingsToCalendarEvents(payloads: CalendarBookingPayload[]): CalendarEvent[] {
  return payloads.map((b) => ({
    id: b.id,
    title: b.clientName,
    start: new Date(b.startTime),
    end: new Date(b.endTime),
    color: statusToColor(b.status),
    attendees: b.artistName ? [{ name: b.artistName, avatar: undefined }] : undefined,
    artistName: b.artistName ?? null,
    type: b.type as CalendarEvent['type'],
    status: b.status,
    clientEmail: b.clientEmail,
  }));
}
