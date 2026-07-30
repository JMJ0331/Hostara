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
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = now.getDate();

  const d1 = new Date(now); d1.setDate(d1.getDate() - 3);
  const d1End = new Date(now); // Check-out today!
  
  const d2 = new Date(now); d2.setDate(d2.getDate() + 2);
  const d2End = new Date(now); d2End.setDate(d2End.getDate() + 5);

  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RentasMaster//iCal Generator 1.0//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Feed iCal ${propertyName} (${platform})
BEGIN:VEVENT
UID:airbnb-reservation-${propertyName.toLowerCase().replace(/[^a-z0-9]/g, '')}-101
DTSTAMP:${formatDate(now)}
DTSTART;VALUE=DATE:${parseICalDate(formatDate(d1))}
DTEND;VALUE=DATE:${parseICalDate(formatDate(d1End))}
SUMMARY:${platform === 'Airbnb' ? 'Airbnb (HM982341) - Sophia Martinez' : 'Booking.com - Sophia Martinez'}
DESCRIPTION:Reserva confirmada via ${platform}. 2 adultos.
END:VEVENT
BEGIN:VEVENT
UID:booking-reservation-${propertyName.toLowerCase().replace(/[^a-z0-9]/g, '')}-102
DTSTAMP:${formatDate(now)}
DTSTART;VALUE=DATE:${parseICalDate(formatDate(d2))}
DTEND;VALUE=DATE:${parseICalDate(formatDate(d2End))}
SUMMARY:${platform === 'Booking' ? 'Booking.com - Mateo Fernandez' : 'Airbnb (HM445122) - Mateo Fernandez'}
DESCRIPTION:Reserva de 3 noches.
END:VEVENT
END:VCALENDAR`;
}
