const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Convierte una fecha ISO (yyyy-mm-dd) a texto legible.
 * Se agrega la hora local para evitar corrimientos de zona horaria.
 */
export function formatDate(value: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

/** Convierte un `LocalDateTime` ISO (yyyy-mm-ddThh:mm) a texto legible. */
export function formatDateTime(value: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
