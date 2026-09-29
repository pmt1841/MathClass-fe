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
    let cleanStr = dateInput.trim();
    if (cleanStr.includes(' ') && !cleanStr.includes('T')) {
      cleanStr = cleanStr.replace(' ', 'T');
    }
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

export function formatDateTime24h(dateInput: Date | string | number | null | undefined | any[]): string {
  const d = parseDateSafe(dateInput);
  if (!d) return '';
  return format(d, 'HH:mm:ss dd-MM-yyyy');
}

/**
 * Định dạng ngày giờ chuẩn xác theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, GMT+7)
 * Đảm bảo hiển thị đúng giờ Việt Nam độc lập với múi giờ của trình duyệt/hệ điều hành.
 */
export function formatVnDateTime(dateInput: Date | string | number | null | undefined | any[]): string {
  const d = parseDateSafe(dateInput);
  if (!d) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(d);
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

export function formatRelativeLastLogin(
  dateInput: Date | string | number | null | undefined | any[],
  t?: (key: string, variables?: Record<string, string | number>) => string
): string {
  const d = parseDateSafe(dateInput);
  if (!d) return t ? t('Chưa đăng nhập') : 'Chưa đăng nhập';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 0 || diffMs < 60 * 1000) {
    return t ? t('Vừa xong') : 'Vừa xong';
  }

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) {
    return t ? t('{minutes} phút trước', { minutes }) : `${minutes} phút trước`;
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) {
    const remainMinutes = minutes % 60;
    if (remainMinutes > 0) {
      return t
        ? t('{hours} giờ {minutes} phút trước', { hours, minutes: remainMinutes })
        : `${hours} giờ ${remainMinutes} phút trước`;
    }
    return t ? t('{hours} giờ trước', { hours }) : `${hours} giờ trước`;
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 30) {
    return t ? t('{days} ngày trước', { days }) : `${days} ngày trước`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return t ? t('{months} tháng trước', { months }) : `${months} tháng trước`;
  }

  const years = Math.floor(days / 365);
  const finalYears = Math.max(1, years);
  return t ? t('{years} năm trước', { years: finalYears }) : `${finalYears} năm trước`;
}

export function normalizeKatexDelimiters(content: string): string {
  if (!content) return ''
  let result = content

  // 0. Thay thế literal \n, \r\n do AI sinh ra thành ngắt dòng thực tế trong Markdown (ngoại trừ các lệnh LaTeX bắt đầu bằng \n như \neq, \notin, \nabla...)
  result = result.replace(
    /\\r\\n|\\n(?!(?:eq|e|abla|atural|approx|earrow|eg|equiv|exists|geq|geqq|geqslant|gtr|i|Leftarrow|LeftrightArrow|Leftrightarrow|leftrightarrow|leftarrow|leq|leqq|leqslant|less|mid|models|odepart|olimits|ormalsize|ormalcolor|ormalfont|ot|otin|otni|parallel|prec|preceq|Rightarrow|rightarrow|shortmid|shortparallel|sim|simeq|subset|subseteq|succ|succeq|supset|supseteq|triangleleft|trianglelefteq|triangleright|trianglerighteq|u|vDash|vdash|VDash|Vdash|warrow|ewline|onumber|otag|oindent)\b)/g,
    '\n\n'
  )
  result = result.replace(/\n{3,}/g, '\n\n')

  // 1. Chuyển \( ... \) thành $...$
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')

  // 2. Chuyển \[ ... \] thành $$...$$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')

  // 3. Khắc phục lỗi JSON parser biến \text{cm} thành Tab + ext hoặc extcm (ví dụ 6extcm -> 6\text{ cm})
  result = result.replace(/[\t\u0009]ext\{?/g, '\\text{')
  result = result.replace(/(\d)\s*ext\s*\{?([a-zA-Z]+)\}?/g, '$1\\text{ $2}')
  result = result.replace(/(\d)\s*\\?text\{\s*([a-zA-Z]+)\}/g, '$1\\text{ $2}')

  // 4. Khắc phục lỗi AI lồng dấu đô-la
  result = result.replace(/\$([a-zA-ZÀ-ỹ\s]+?)\s*\$([^$\n]+?)\$\$/g, '($1 $$$2$$)')

  return result
}
