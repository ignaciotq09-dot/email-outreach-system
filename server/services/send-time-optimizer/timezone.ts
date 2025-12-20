import { TIMEZONE_OFFSETS } from "./constants";

export function inferTimezoneFromLocation(location?: string): string {
  if (!location) return 'America/New_York';
  const l = location.toLowerCase();
  if (l.includes('california') || l.includes('los angeles') || l.includes('san francisco') || l.includes('seattle') || l.includes('portland') || l.includes('pacific')) return 'America/Los_Angeles';
  if (l.includes('chicago') || l.includes('dallas') || l.includes('houston') || l.includes('denver') || l.includes('central')) return 'America/Chicago';
  if (l.includes('new york') || l.includes('boston') || l.includes('miami') || l.includes('atlanta') || l.includes('eastern') || l.includes('washington')) return 'America/New_York';
  if (l.includes('london') || l.includes('uk') || l.includes('united kingdom')) return 'Europe/London';
  if (l.includes('paris') || l.includes('france') || l.includes('germany') || l.includes('berlin')) return 'Europe/Paris';
  if (l.includes('tokyo') || l.includes('japan')) return 'Asia/Tokyo';
  if (l.includes('sydney') || l.includes('australia')) return 'Australia/Sydney';
  return 'America/New_York';
}

export function getNextOccurrence(dayOfWeek: number, hour: number, timezone: string): Date {
  const now = new Date(); const offset = TIMEZONE_OFFSETS[timezone] || -5;
  const targetDate = new Date(now); const currentDay = targetDate.getDay(); let daysToAdd = dayOfWeek - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  if (daysToAdd === 0) { const currentHourUTC = targetDate.getUTCHours(); const currentHourLocal = currentHourUTC + offset; if (currentHourLocal >= hour) daysToAdd = 7; }
  targetDate.setDate(targetDate.getDate() + daysToAdd); targetDate.setUTCHours(hour - offset, 0, 0, 0);
  return targetDate;
}
