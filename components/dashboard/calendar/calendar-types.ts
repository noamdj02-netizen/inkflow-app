import type { LucideIcon } from 'lucide-react';

export type ViewMode = 'daily' | 'weekly' | 'monthly';

export type EventColor = 'pink' | 'blue' | 'purple' | 'orange' | 'teal' | 'red' | 'gray';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: EventColor;
  attendees?: { name: string; avatar?: string }[];
  /** Optionnel : nom de l'artiste pour affichage */
  artistName?: string | null;
  /** Pour la modale d'édition (provenant du booking) */
  type?: 'CONSULTATION' | 'SESSION' | 'RETOUCHE';
  status?: string;
  clientEmail?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

export interface OtherCalendarItem {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface MeetingReminder {
  id: string;
  title: string;
  time: string;
  attendees: { name: string; initials: string }[];
}
