import type { CurrentWeather, WeatherLocation, WeatherUnits } from '../types/weather'

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const REQUEST_TIMEOUT_MS = 15_000
const CURRENT_VARIABLES = [
  'relative_humidity_2m',
  'temperature_2m',
  'apparent_temperature',
  'is_day',
  'wind_speed_10m',
  'wind_direction_10m',
  'precipitation_probability',
  'weather_code',
].join(',')

type GeocodingResult = {
  id?: number
  name: string
  latitude: number
  longitude: number
  country_code: string
  timezone: string
  country?: string
  admin1?: string
  admin2?: string
  admin3?: string
  admin4?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidTimezone(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

function isGeocodingResult(value: unknown): value is GeocodingResult {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.name) &&
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180 &&
    isNonEmptyString(value.country_code) &&
    isValidTimezone(value.timezone)
  )
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function toWeatherLocation(result: GeocodingResult): WeatherLocation {
  return {
    ...(typeof result.id === 'number' && Number.isFinite(result.id)
      ? { id: result.id }
      : {}),
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    countryCode: result.country_code,
    timezone: result.timezone,
    ...(optionalString(result.country) !== undefined
      ? { country: optionalString(result.country) }
      : {}),
    ...(optionalString(result.admin1) !== undefined
      ? { admin1: optionalString(result.admin1) }
      : {}),
    ...(optionalString(result.admin2) !== undefined
      ? { admin2: optionalString(result.admin2) }
      : {}),
    ...(optionalString(result.admin3) !== undefined
      ? { admin3: optionalString(result.admin3) }
      : {}),
    ...(optionalString(result.admin4) !== undefined
      ? { admin4: optionalString(result.admin4) }
      : {}),
  }
}

function isValidLocation(value: unknown): value is WeatherLocation {
  if (!isRecord(value)) return false

  return (
    isNonEmptyString(value.name) &&
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180 &&
    isNonEmptyString(value.countryCode) &&
    isValidTimezone(value.timezone)
  )
}

async function requestJson(url: URL): Promise<unknown | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function searchCities(name: string): Promise<WeatherLocation[] | null> {
  if (typeof name !== 'string' || name.trim().length === 0) return null

  const url = new URL(GEOCODING_ENDPOINT)
  url.search = new URLSearchParams({
    name: name.trim(),
    count: '10',
    language: 'pt',
    format: 'json',
  }).toString()

  const data = await requestJson(url)
  if (!isRecord(data) || !Array.isArray(data.results)) return null

  const locations = data.results
    .filter(isGeocodingResult)
    .map(toWeatherLocation)

  return locations.length > 0 ? locations : null
}

export async function getCurrentWeather(
  location: WeatherLocation,
): Promise<CurrentWeather | null> {
  if (!isValidLocation(location)) return null

  const url = new URL(FORECAST_ENDPOINT)
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: CURRENT_VARIABLES,
    timezone: location.timezone,
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  }).toString()

  const data = await requestJson(url)
  if (!isRecord(data) || !isRecord(data.current) || !isRecord(data.current_units)) {
    return null
  }

  const current = data.current
  const currentUnits = data.current_units
  const numericFields = [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'is_day',
    'wind_speed_10m',
    'wind_direction_10m',
    'precipitation_probability',
    'weather_code',
  ]

  if (
    numericFields.some(
      (field) => typeof current[field] !== 'number' || !Number.isFinite(current[field]),
    )
  ) {
    return null
  }

  const values = current as Record<(typeof numericFields)[number], number>
  if (
    (values.is_day !== 0 && values.is_day !== 1) ||
    values.relative_humidity_2m < 0 ||
    values.relative_humidity_2m > 100 ||
    values.precipitation_probability < 0 ||
    values.precipitation_probability > 100 ||
    values.wind_speed_10m < 0 ||
    values.wind_direction_10m < 0 ||
    values.wind_direction_10m > 360 ||
    !Number.isInteger(values.weather_code)
  ) {
    return null
  }

  const expectedUnits = {
    temperature2m: '°C',
    apparentTemperature: '°C',
    relativeHumidity2m: '%',
    windSpeed10m: 'km/h',
    windDirection10m: '°',
    precipitationProbability: '%',
    isDay: '',
  } satisfies WeatherUnits
  const unitFields: [keyof WeatherUnits, string][] = [
    ['temperature2m', 'temperature_2m'],
    ['apparentTemperature', 'apparent_temperature'],
    ['relativeHumidity2m', 'relative_humidity_2m'],
    ['windSpeed10m', 'wind_speed_10m'],
    ['windDirection10m', 'wind_direction_10m'],
    ['precipitationProbability', 'precipitation_probability'],
    ['isDay', 'is_day'],
  ]
  for (const [unitKey, field] of unitFields) {
    if (currentUnits[field] !== expectedUnits[unitKey]) return null
  }

  const units: WeatherUnits = {
    temperature2m: expectedUnits.temperature2m,
    apparentTemperature: expectedUnits.apparentTemperature,
    relativeHumidity2m: expectedUnits.relativeHumidity2m,
    windSpeed10m: expectedUnits.windSpeed10m,
    windDirection10m: expectedUnits.windDirection10m,
    precipitationProbability: expectedUnits.precipitationProbability,
    isDay: expectedUnits.isDay,
  }

  return {
    temperature2m: values.temperature_2m,
    apparentTemperature: values.apparent_temperature,
    relativeHumidity2m: values.relative_humidity_2m,
    isDay: values.is_day,
    windSpeed10m: values.wind_speed_10m,
    windDirection10m: values.wind_direction_10m,
    precipitationProbability: values.precipitation_probability,
    weatherCode: values.weather_code,
    units,
  }
}