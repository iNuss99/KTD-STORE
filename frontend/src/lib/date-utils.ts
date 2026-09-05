/**
 * Safely parses date strings from backend APIs.
 * If backend returns ISO string without timezone (e.g. '2026-09-05 13:12:28' or '2026-09-05T13:12:28'),
 * treat it as UTC by appending 'Z' so the browser converts it properly to local time.
 */
export function parseDate(dateInput: string | Date | number | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'number') return new Date(dateInput);

  let str = String(dateInput).trim();
  if (!str) return new Date();

  // If string does not specify timezone offset (+HH:mm or -HH:mm or Z), assume UTC
  if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }
  return new Date(str);
}

export function formatDateTime(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(dateInput);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

export function formatDate(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(dateInput);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...options,
  });
}
