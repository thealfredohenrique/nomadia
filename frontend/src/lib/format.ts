export function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', options);
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr);
}

export function formatDateLong(dateStr: string): string {
  return formatDate(dateStr, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
