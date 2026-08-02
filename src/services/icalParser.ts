import { Platform } from '../types';

export interface ParsedICalEvent {
  uid: string;
  summary: string;
  guestName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  platform: Platform;
  description?: string;
}

/**
 * Clean & Format raw iCal date string to YYYY-MM-DD
 */
export function parseICalDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // Remove TZID prefix if present e.g. "TZID=America/Mexico_City:20260730T150000"
  let cleanStr = dateStr;
  if (cleanStr.includes(':')) {
    cleanStr = cleanStr.split(':').pop() || cleanStr;
  }
  cleanStr = cleanStr.trim().replace(/[^0-9]/g, ''); // Extract digits

  if (cleanStr.length >= 8) {
    const year = cleanStr.substring(0, 4);
    const month = cleanStr.substring(4, 6);
    const day = cleanStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Extract guest name and platform from event summary
 */
export function parseGuestAndPlatform(summary: string, description: string = ''): { guestName: string; platform: Platform } {
  const combined = `${summary} ${description}`.toLowerCase();
  
  let platform: Platform = 'Other';
  if (combined.includes('airbnb')) platform = 'Airbnb';
  else if (combined.includes('booking')) platform = 'Booking';
  else if (combined.includes('vrbo') || combined.includes('homeaway')) platform = 'Vrbo';
  else if (combined.includes('direct') || combined.includes('directa')) platform = 'Direct';

  // Extract guest name cleanly from common iCal summary formats
  // Examples: "Reserved - Carlos Gomez", "Airbnb (HM8923412)", "Not available / Blocked", "Carlos Gomez - Booking"
  let guestName = summary.trim();

  if (summary.includes('-')) {
    const parts = summary.split('-');
    const filtered = parts.filter(p => !p.toLowerCase().includes('airbnb') && !p.toLowerCase().includes('booking') && !p.toLowerCase().includes('reserved'));
    if (filtered.length > 0) {
      guestName = filtered.join(' ').trim();
    }
  } else if (summary.toLowerCase().includes('airbnb')) {
    guestName = summary.replace(/airbnb/i, '').replace(/[\(\)]/g, '').trim() || 'Huésped Airbnb';
  } else if (summary.toLowerCase().includes('booking')) {
    guestName = summary.replace(/booking\.com/i, '').replace(/booking/i, '').trim() || 'Huésped Booking';
  }

  if (!guestName || guestName.length < 2 || guestName.toLowerCase() === 'reserved' || guestName.toLowerCase() === 'no disponible') {
    guestName = `Reserva ${platform}`;
  }

  return { guestName, platform };
}

/**
 * Parse raw .ics content string into structured event objects
 */
export function parseICalString(icsContent: string): ParsedICalEvent[] {
  const events: ParsedICalEvent[] = [];
  const lines = icsContent.split(/\r?\n/);

  let inEvent = false;
  let currentEvent: Record<string, string> = {};

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Handle line unfold (multiline fields in iCal)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substring(1);
    }

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inEvent) {
        const uid = currentEvent['UID'] || `ical-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const summary = currentEvent['SUMMARY'] || 'Reserva Sincronizada';
        const description = currentEvent['DESCRIPTION'] || '';
        const dtStartRaw = currentEvent['DTSTART'] || currentEvent['DTSTART;VALUE=DATE'];
        const dtEndRaw = currentEvent['DTEND'] || currentEvent['DTEND;VALUE=DATE'];

        const checkIn = parseICalDate(dtStartRaw);
        const checkOut = parseICalDate(dtEndRaw);
        const { guestName, platform } = parseGuestAndPlatform(summary, description);

        events.push({
          uid,
          summary,
          guestName,
          checkIn,
          checkOut,
          platform,
          description
        });
      }
      inEvent = false;
      continue;
    }

    if (inEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.substring(0, colonIndex).toUpperCase();
        const value = line.substring(colonIndex + 1);
        
        // Match key ignoring parameters before semicolon e.g. DTSTART;VALUE=DATE
        const baseKey = key.split(';')[0];
        currentEvent[key] = value;
        currentEvent[baseKey] = value;
      }
    }
  }

  return events;
}

/**
 * Generates sample realistic iCal ICS string for demo testing
 */
export function generateSampleICalFeed(propertyName: string, platform: Platform = 'Airbnb'): string {
  const now = new Date();
  const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const propClean = sanitize(propertyName);

  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // 1. Active reservation (Check-in 2 days ago, Check-out in 2 days) - Current day & month
  const d1In = new Date(now); d1In.setDate(d1In.getDate() - 2);
  const d1Out = new Date(now); d1Out.setDate(d1Out.getDate() + 2);

  // 2. Starts TODAY (Check-in today, Check-out in 4 days) - Current day & month
  const d2In = new Date(now);
  const d2Out = new Date(now); d2Out.setDate(d2Out.getDate() + 4);

  // 3. Mid current month (Check-in in 6 days, Check-out in 10 days)
  const d3In = new Date(now); d3In.setDate(d3In.getDate() + 6);
  const d3Out = new Date(now); d3Out.setDate(d3Out.getDate() + 10);

  // 4. Late current month (Check-in in 14 days, Check-out in 18 days)
  const d4In = new Date(now); d4In.setDate(d4In.getDate() + 14);
  const d4Out = new Date(now); d4Out.setDate(d4Out.getDate() + 18);

  // 5. Future month reservation (Check-in in 35 days, Check-out in 40 days)
  const d5In = new Date(now); d5In.setDate(d5In.getDate() + 35);
  const d5Out = new Date(now); d5Out.setDate(d5Out.getDate() + 40);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Hostara//iCal Engine 2.0//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Feed iCal ${propertyName} (${platform})
BEGIN:VEVENT
UID:airbnb-res-${propClean}-101
DTSTAMP:${formatDate(now)}
DTSTART;VALUE=DATE:${parseICalDate(formatDate(d1In))}
DTEND;VALUE=DATE:${parseICalDate(formatDate(d1Out))}
SUMMARY:Airbnb (HM-89214) - Sophia Martinez
DESCRIPTION:Reserva iCal activa en curso (${platform}).
END:VEVENT
BEGIN:VEVENT
UID:airbnb-res-${propClean}-102
DTSTAMP:${formatDate(now)}
DTSTART;VALUE=DATE:${parseICalDate(formatDate(d2In))}
DTEND;VALUE=DATE:${parseICalDate(formatDate(d2Out))}
SUMMARY:Airbnb (HM-99302) - Carlos Mendoza
DESCRIPTION:Llegada el día de hoy. Reserva de 4 noches.
END:VEVENT
BEGIN:VEVENT
UID:booking-res-${propClean}-103
DTSTAMP:${formatDate(now)}
DTSTART;VALUE=DATE:${parseICalDate(formatDate(d3In))}
DTEND;VALUE=DATE:${parseICalDate(formatDate(d3Out))}
SUMMARY:Booking.com - Laura Hernandez
DESCRIPTION:Reserva confirmada de 4 noches.
END:VEVENT
BEGIN:VEVENT
UID:airbnb-res-${propClean}-104
DTSTAMP:${formatDate(now)}
DTSTART;VALUE=DATE:${parseICalDate(formatDate(d4In))}
DTEND;VALUE=DATE:${parseICalDate(formatDate(d4Out))}
SUMMARY:Airbnb (HM-10492) - Alejandro Torres
DESCRIPTION:Reserva confirmada mes actual.
END:VEVENT
BEGIN:VEVENT
UID:vrbo-res-${propClean}-105
DTSTAMP:${formatDate(now)}
DTSTART;VALUE=DATE:${parseICalDate(formatDate(d5In))}
DTEND;VALUE=DATE:${parseICalDate(formatDate(d5Out))}
SUMMARY:Vrbo - Beatriz Ramirez
DESCRIPTION:Reserva programada para el próximo mes.
END:VEVENT
END:VCALENDAR`;
}
