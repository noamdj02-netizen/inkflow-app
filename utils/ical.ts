/**
 * RFC 5545 iCalendar format helpers
 * Used for generating .ics feed for Apple Calendar / Google Calendar / Android
 */

/**
 * Escape special characters in iCal text (RFC 5545 section 3.3.11)
 */
function escapeIcalText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format date for iCal DTSTART/DTEND (DATE-TIME in UTC, format: YYYYMMDDTHHmmssZ)
 */
function formatIcalDateTime(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hour = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const sec = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hour}${min}${sec}Z`;
}

export interface IcalEventInput {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  updatedAt?: Date;
}

/**
 * Generate a single VEVENT block (RFC 5545)
 */
export function toVEvent(event: IcalEventInput): string {
  const dtstamp = formatIcalDateTime(event.updatedAt || event.start);
  const dtstart = formatIcalDateTime(event.start);
  const dtend = formatIcalDateTime(event.end);
  const uid = `inkflow-${event.id}@inkflow.app`;
  const summary = escapeIcalText(event.title);
  const desc = event.description ? escapeIcalText(event.description) : '';
  const loc = event.location ? escapeIcalText(event.location) : '';

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
  ];
  if (desc) lines.push(`DESCRIPTION:${desc}`);
  if (loc) lines.push(`LOCATION:${loc}`);
  lines.push('END:VEVENT');

  return lines.join('\r\n');
}

/**
 * Generate full iCal calendar (VCALENDAR with VEVENTs)
 */
export function toIcal(events: IcalEventInput[], calendarName: string = 'InkFlow'): string {
  const escapedName = escapeIcalText(calendarName);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InkFlow//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapedName}`,
  ];

  for (const event of events) {
    lines.push(toVEvent(event));
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
