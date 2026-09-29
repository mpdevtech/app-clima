export function formatWeatherNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits }).format(value)
}

export function formatCurrentDate(timeZone: string, instant = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(instant)
}