const PERU_TIME_ZONE = 'America/Lima';

const toDate = (value) => value instanceof Date ? value : new Date(value);

export const formatPeruDateTime = (value, options = {}) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: PERU_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options
  }).format(toDate(value));

export const formatPeruTime = (value) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: PERU_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit'
  }).format(toDate(value));
