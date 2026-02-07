/**
 * Types pour le module Calendrier (FullCalendar, drag & drop, disponibilités)
 */

export interface CalendarEventSource {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps?: {
    bookingId: string;
    clientName?: string | null;
    clientEmail?: string;
    type?: 'flash' | 'project' | 'manual';
  };
}

export interface SlotAvailabilityResult {
  available: boolean;
  reason?: string;
}

export interface UpdateAppointmentPayload {
  start: Date;
  end: Date;
}

/** Jours 0 = Lundi … 6 = Dimanche, heures 8–20 */
export type SlotKey = string; // `${day}-${hour}`

export type PaintMode = 'available' | 'blocked';

export interface DisponibilitesState {
  [slotKey: string]: boolean | undefined; // true = available, false/undefined = blocked
}

/** Conflit : un RDV tombe sur un créneau marqué indisponible */
export interface AvailabilityConflict {
  id: string;
  bookingId: string;
  clientName: string | null;
  date: Date;
  day: number; // 0 = Lun … 6 = Dim
  hour: number;
  slot: string;
  title?: string;
}

/** Préférences client pour le scoring des créneaux suggérés */
export interface ClientPreferences {
  /** Préférence horaire : 'morning' (9-12), 'afternoon' (14-18), 'any' */
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'any';
  /** Grouper les RDV le même jour si possible */
  preferGroupWithOtherAppointments?: boolean;
}

/** Créneau suggéré avec score (tri décroissant = meilleur en premier) */
export interface SuggestedSlot {
  id: string;
  start: Date;
  end: Date;
  score: number;
  available: true;
}

/** Template de disponibilités (semaine type) */
export interface AvailabilityTemplate {
  id: string;
  name: string;
  schedule: DisponibilitesState;
  recurrence: 'weekly';
  createdAt: string; // ISO
}

/** Client existant (dérivé des bookings) pour QuickAdd */
export interface ExistingClient {
  client_name: string | null;
  client_email: string;
  client_phone: string | null;
}
