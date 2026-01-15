import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Manila';

export function toManilaTime(date: string | Date): Date {
  return utcToZonedTime(date, TIMEZONE);
}

export function toUtc(date: string | Date): Date {
  return zonedTimeToUtc(date, TIMEZONE);
}

export function formatManilaDateTime(date: string): string {
  const manilaDate = toManilaTime(date);
  return manilaDate.toLocaleString('en-PH', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isWeekend(date: string): boolean {
  const d = new Date(date);
  return d.getDay() === 0 || d.getDay() === 6; // Sunday or Saturday
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}