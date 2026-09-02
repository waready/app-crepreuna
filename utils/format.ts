export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('es-PE', {
    currency: 'PEN',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Sin fecha';
  const date = parseDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('es-PE', options ?? {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export function relativeTime(value?: string | null) {
  if (!value) return '';
  const date = parseDate(value);
  if (!date) return formatDateTime(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, divider] of ranges) {
    if (Math.abs(seconds) >= divider) return formatter.format(Math.round(seconds / divider), unit);
  }
  return 'ahora';
}

export function periodLabel(period?: { codigo?: string | null; nombre?: string | null } | null) {
  return period?.codigo || period?.nombre || 'Ciclo activo';
}

export function initials(name?: string | null) {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CP';
}

export function readableStatus(value?: string | null) {
  if (!value) return 'Sin estado';
  return value
    .replace(/_/g, ' ')
    .toLocaleLowerCase('es-PE')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function parseDate(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00`
    : value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}
