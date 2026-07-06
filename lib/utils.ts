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
    return new Date(year, month - 1, day, hour, minute, second);
  }

  if (typeof dateInput === 'string') {
    // Prevent auto-shifting to UTC by standardizing
    // If the date string has a 'Z' appended from a hack, remove it to parse as local time
    let cleanStr = dateInput;
    if (cleanStr.includes('T') && cleanStr.endsWith('Z') && !cleanStr.includes('+')) {
      cleanStr = cleanStr.substring(0, cleanStr.length - 1);
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
