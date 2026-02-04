/**
 * Algorithme de suggestion de créneaux : score chaque créneau disponible
 * selon préférences client, regroupement avec autres RDV, et fragmentation.
 */
import type { DisponibilitesState } from '../types/calendar';
import type { ClientPreferences, SuggestedSlot } from '../types/calendar';
import type { CalendarEventInput } from '../hooks/useCalendar';

const HOUR_START = 8;
const HOUR_END = 20;
const SLOT_STEP_MIN = 30;
const DAYS_AHEAD = 14;

function slotKey(day: number, hour: number): string {
  return `${day}-${hour}`;
}

/** Lundi = 0, Dimanche = 6 */
function dayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  appointments: CalendarEventInput[]
): boolean {
  for (const apt of appointments) {
    const aptStart = apt.start.getTime();
    const aptEnd = apt.end.getTime();
    const start = slotStart.getTime();
    const end = slotEnd.getTime();
    if (start < aptEnd && end > aptStart) return true;
  }
  return false;
}

/** Vérifie que tout le créneau [start, start+durationMin] est disponible selon le template hebdo (heures entières). */
function isSlotFullyAvailable(
  start: Date,
  durationMin: number,
  disponibilites: DisponibilitesState
): boolean {
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const day = dayOfWeek(start);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  for (let h = Math.floor(startHour); h < Math.ceil(endHour); h++) {
    if (h < HOUR_START || h >= HOUR_END) return false;
    if (disponibilites[slotKey(day, h)] !== true) return false;
  }
  return true;
}

/** Génère les créneaux candidats (début uniquement en :00 ou :30) sur les N prochains jours. */
function getCandidateSlots(
  durationMin: number,
  disponibilites: DisponibilitesState
): { start: Date; end: Date }[] {
  const candidates: { start: Date; end: Date }[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (let d = 0; d < DAYS_AHEAD; d++) {
    const date = new Date(now + d * oneDay);
    date.setHours(0, 0, 0, 0);
    const day = dayOfWeek(date);

    for (let hour = HOUR_START; hour < HOUR_END; hour++) {
      for (const min of [0, 30]) {
        if (hour === HOUR_END - 1 && min === 30) continue;
        const start = new Date(date);
        start.setHours(hour, min, 0, 0);
        const end = new Date(start.getTime() + durationMin * 60 * 1000);
        const endHour = end.getHours() + end.getMinutes() / 60;
        if (endHour > HOUR_END) continue;
        if (start.getTime() < now) continue;

        if (isSlotFullyAvailable(start, durationMin, disponibilites)) {
          candidates.push({ start, end });
        }
      }
    }
  }
  return candidates;
}

/**
 * Score un créneau (plus haut = mieux).
 * Facteurs : préférence horaire, regroupement avec autres RDV, éviter fragmentation.
 */
function calculateSlotScore(
  slot: { start: Date; end: Date },
  ctx: {
    duration: number;
    preferences?: ClientPreferences;
    existingAppointments: CalendarEventInput[];
  }
): number {
  let score = 100;
  const { start, end } = slot;
  const hour = start.getHours() + start.getMinutes() / 60;
  const appointments = ctx.existingAppointments;

  // Préférence horaire client
  if (ctx.preferences?.preferredTimeOfDay === 'morning' && hour >= 9 && hour < 12) score += 30;
  else if (ctx.preferences?.preferredTimeOfDay === 'afternoon' && hour >= 14 && hour < 18) score += 30;
  else if (ctx.preferences?.preferredTimeOfDay === 'any') score += 5;

  // Grouper avec autres RDV le même jour
  if (ctx.preferences?.preferGroupWithOtherAppointments !== false && appointments.length > 0) {
    const slotDay = start.toDateString();
    const sameDay = appointments.some((apt) => apt.start.toDateString() === slotDay);
    if (sameDay) score += 25;
  }

  // Proximité avec un autre RDV (même jour, pas trop loin) = bonus regroupement
  const sameDayApts = appointments.filter((apt) => apt.start.toDateString() === start.toDateString());
  for (const apt of sameDayApts) {
    const aptEnd = apt.end.getTime();
    const slotStart = start.getTime();
    const gapMin = Math.abs(slotStart - aptEnd) / (60 * 1000);
    if (gapMin >= 0 && gapMin <= 120) score += 15; // 2h de pause max pour "grouper"
  }

  // Légère préférence pour matin / début d'après-midi (éviter fin de journée)
  if (hour >= 8 && hour < 10) score += 5;
  if (hour >= 14 && hour < 16) score += 5;

  return score;
}

export interface CalendarData {
  disponibilites: DisponibilitesState;
  appointments: CalendarEventInput[];
}

/**
 * Suggère les meilleurs créneaux pour une durée donnée.
 * Retourne les 5 créneaux avec le score le plus élevé.
 */
export function suggestBestSlots(
  durationMin: number,
  preferences: ClientPreferences | undefined,
  data: CalendarData
): SuggestedSlot[] {
  const { disponibilites, appointments } = data;
  const candidates = getCandidateSlots(durationMin, disponibilites);

  const scored = candidates
    .filter((slot) => !overlaps(slot.start, slot.end, appointments))
    .map((slot) => ({
      ...slot,
      id: `${slot.start.toISOString()}-${durationMin}`,
      score: calculateSlotScore(slot, {
        duration: durationMin,
        preferences,
        existingAppointments: appointments,
      }),
      available: true as const,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}
