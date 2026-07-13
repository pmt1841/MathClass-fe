import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow as dateFnsFormatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDateSafe(dateInput: Date | string | number | null | undefined | any[]): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  
  if (Array.isArray(dateInput)) {
    // Handling Spring Boot LocalDateTime array [YYYY, MM, DD, HH, mm, ss, ns]
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
    // The backend is configured to UTC, so the array values are in UTC
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }

  if (typeof dateInput === 'string') {
    let cleanStr = dateInput;
    // Since Backend is now forced to UTC, any date string without timezone info is actually UTC.
    // Ensure it's parsed as UTC by appending 'Z' if it doesn't have timezone info.
    if (cleanStr.includes('T') && !cleanStr.endsWith('Z') && !cleanStr.match(/[+-]\d{2}(:\d{2})?$/)) {
      cleanStr = cleanStr + 'Z';
    }
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateInput: Date | string | number | null | undefined | any[]): string {
  const d = parseDateSafe(dateInput);
  if (!d) return '';
  return format(d, 'dd/MM/yyyy');
}

export function formatDateTime(dateInput: Date | string | number | null | undefined | any[]): string {
  const d = parseDateSafe(dateInput);
  if (!d) return '';
  return format(d, 'HH:mm:ss dd/MM/yyyy');
}

export function formatTime(dateInput: Date | string | number | null | undefined | any[]): string {
  const d = parseDateSafe(dateInput);
  if (!d) return '';
  return format(d, 'HH:mm:ss');
}

export function formatDistanceToNowSafe(dateInput: Date | string | number | null | undefined | any[], options?: any): string {
  const d = parseDateSafe(dateInput);
  if (!d) return '';
  return dateFnsFormatDistanceToNow(d, { locale: vi, ...options });
}
