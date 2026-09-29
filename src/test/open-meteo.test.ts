import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentWeather, searchCities } from '../services/open-meteo'
import { completeWeather, validLocation, zeroWeather } from './fixtures'

const validResult = {
  id: 1,
  name: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
  country_code: 'BR',
  timezone: 'America/Sao_Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
  admin2: 'Capital',
  admin3: 'Subprefeitura',
  admin4: 'Distrito',
}

function mockJsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.useFakeTimers()
})

describe('searchCities', () => {
  it('builds the Open-Meteo URL with encoded city and required parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ results: [validResult] }))
    vi.stubGlobal('fetch', fetchMock)

    await searchCities('  São Paulo  ')

    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestUrl.origin + requestUrl.pathname).toBe(
      'https://geocoding-api.open-meteo.com/v1/search',
    )
    expect(requestUrl.searchParams.get('name')).toBe('São Paulo')
    expect(requestUrl.searchParams.get('count')).toBe('10')
    expect(requestUrl.searchParams.get('language')).toBe('pt')
    expect(requestUrl.searchParams.get('format')).toBe('json')
    expect(requestUrl.search).toContain('%C3%A3o')
  })

  it.each(['', '   ', null, 42])('does not fetch an invalid name: %s', async (name) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await searchCities(name as string)).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns valid results in provider order, including homonyms and optional metadata', async () => {
    const first = { ...validResult, latitude: 0, longitude: 0 }
    const second = {
      name: validResult.name,
      latitude: 1,
      longitude: 2,
      country_code: validResult.country_code,
      timezone: validResult.timezone,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockJsonResponse({ results: [first, {}, second] }))
    vi.stubGlobal('fetch', fetchMock)

    const locations = await searchCities('São Paulo')

    expect(locations).toEqual([
      {
        id: 1,
        name: 'São Paulo',
        latitude: 0,
        longitude: 0,
        countryCode: 'BR',
        timezone: 'America/Sao_Paulo',
        country: 'Brasil',
        admin1: 'São Paulo',
        admin2: 'Capital',
        admin3: 'Subprefeitura',
        admin4: 'Distrito',
      },
      {
        name: 'São Paulo',
        latitude: 1,
        longitude: 2,
        countryCode: 'BR',
        timezone: 'America/Sao_Paulo',
      },
    ])
  })

  it.each([{}, { results: [] }, { results: [{}] }, { results: null }])(
    'returns null when no valid locations are present: %j',
    async (data) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockJsonResponse(data)))
      expect(await searchCities('Recife')).toBeNull()
    },
  )

  it.each([
    { ...validResult, latitude: 91 },
    { ...validResult, longitude: -181 },
    { ...validResult, latitude: Number.NaN },
    { ...validResult, name: '  ' },
    { ...validResult, country_code: '' },
    { ...validResult, timezone: 'Invalid/Timezone' },
  ])('filters a location with invalid required fields: %j', async (result) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockJsonResponse({ results: [result] })))
    expect(await searchCities('Recife')).toBeNull()
  })

  it.each([
    ['HTTP failure', () => mockJsonResponse({}, false)],
    ['network failure', () => Promise.reject(new Error('offline'))],
    ['invalid JSON', () => ({ ok: true, json: () => Promise.reject(new Error('invalid')) })],
  ])('returns null for %s without retrying', async (_label, response) => {
    const fetchMock = vi.fn().mockImplementation(response)
    vi.stubGlobal('fetch', fetchMock)

    expect(await searchCities('Recife')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('aborts after 15 seconds and clears the timeout', async () => {
    const fetchMock = vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = searchCities('Recife')
    await vi.advanceTimersByTimeAsync(15_000)

    await expect(result).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})

const currentFields = {
  temperature_2m: completeWeather.temperature2m,
  apparent_temperature: completeWeather.apparentTemperature,
  relative_humidity_2m: completeWeather.relativeHumidity2m,
  is_day: completeWeather.isDay,
  wind_speed_10m: completeWeather.windSpeed10m,
  wind_direction_10m: completeWeather.windDirection10m,
  precipitation_probability: completeWeather.precipitationProbability,
  weather_code: completeWeather.weatherCode,
}

const currentUnits = {
  temperature_2m: '°C',
  apparent_temperature: '°C',
  relative_humidity_2m: '%',
  is_day: '',
  wind_speed_10m: 'km/h',
  wind_direction_10m: '°',
  precipitation_probability: '%',
}

function currentPayload(
  current: Record<string, unknown> = currentFields,
  units: Record<string, unknown> = currentUnits,
): unknown {
  return { current, current_units: units }
}

describe('getCurrentWeather', () => {
  it('requests the selected coordinates and required variables and units', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse(currentPayload()))
    vi.stubGlobal('fetch', fetchMock)

    expect(await getCurrentWeather(validLocation)).toEqual(completeWeather)

    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestUrl.origin + requestUrl.pathname).toBe('https://api.open-meteo.com/v1/forecast')
    expect(requestUrl.searchParams.get('latitude')).toBe(String(validLocation.latitude))
    expect(requestUrl.searchParams.get('longitude')).toBe(String(validLocation.longitude))
    expect(requestUrl.searchParams.get('timezone')).toBe(validLocation.timezone)
    expect(requestUrl.searchParams.get('current')).toBe(
      'relative_humidity_2m,temperature_2m,apparent_temperature,is_day,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code',
    )
    expect(requestUrl.searchParams.get('temperature_unit')).toBe('celsius')
    expect(requestUrl.searchParams.get('wind_speed_unit')).toBe('kmh')
  })

  it.each([
    null,
    {},
    { ...validLocation, latitude: Number.NaN },
    { ...validLocation, latitude: -91 },
    { ...validLocation, longitude: 181 },
    { ...validLocation, timezone: 'Invalid/Timezone' },
    { ...validLocation, name: '' },
    { ...validLocation, countryCode: '' },
  ])('does not fetch for an invalid location: %j', async (location) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await getCurrentWeather(location as typeof validLocation)).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts zero coordinates and values, negative temperatures, night, and unknown integer codes', async () => {
    const locationAtZero = { ...validLocation, latitude: 0, longitude: 0 }
    const weatherWithUnknownCode = {
      ...zeroWeather,
      temperature2m: -5,
      apparentTemperature: -8.4,
      weatherCode: 999,
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse(
          currentPayload(
            {
              ...currentFields,
              temperature_2m: weatherWithUnknownCode.temperature2m,
              apparent_temperature: weatherWithUnknownCode.apparentTemperature,
              is_day: 0,
              weather_code: weatherWithUnknownCode.weatherCode,
              relative_humidity_2m: 0,
              wind_speed_10m: 0,
              wind_direction_10m: 0,
              precipitation_probability: 0,
            },
          ),
        ),
      ),
    )

    expect(await getCurrentWeather(locationAtZero)).toEqual(weatherWithUnknownCode)
  })

  it.each(Object.keys(currentFields))('rejects a missing or invalid metric: %s', async (field) => {
    const current = { ...currentFields }
    delete current[field as keyof typeof current]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockJsonResponse(currentPayload(current))))
    expect(await getCurrentWeather(validLocation)).toBeNull()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse(currentPayload({ ...currentFields, [field]: null })),
      ),
    )
    expect(await getCurrentWeather(validLocation)).toBeNull()
  })

  it.each([
    ['is_day', 2],
    ['relative_humidity_2m', 101],
    ['relative_humidity_2m', -1],
    ['precipitation_probability', 101],
    ['wind_speed_10m', -0.1],
    ['wind_direction_10m', 360.1],
    ['wind_direction_10m', -1],
    ['weather_code', 1.5],
    ['temperature_2m', Number.POSITIVE_INFINITY],
  ])('rejects invalid metric bounds or types: %s=%s', async (field, value) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse(currentPayload({ ...currentFields, [field]: value })),
      ),
    )
    expect(await getCurrentWeather(validLocation)).toBeNull()
  })

  it.each(Object.keys(currentUnits))('rejects a missing or incorrect unit: %s', async (field) => {
    const units = { ...currentUnits }
    delete units[field as keyof typeof units]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockJsonResponse(currentPayload(currentFields, units))))
    expect(await getCurrentWeather(validLocation)).toBeNull()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockJsonResponse(currentPayload(currentFields, { ...currentUnits, [field]: 'invalid' })),
      ),
    )
    expect(await getCurrentWeather(validLocation)).toBeNull()
  })

  it.each([
    ['HTTP failure', () => mockJsonResponse({}, false)],
    ['network failure', () => Promise.reject(new Error('offline'))],
    ['invalid JSON', () => ({ ok: true, json: () => Promise.reject(new Error('invalid')) })],
  ])('returns null for %s without retrying', async (_label, response) => {
    const fetchMock = vi.fn().mockImplementation(response)
    vi.stubGlobal('fetch', fetchMock)

    expect(await getCurrentWeather(validLocation)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('aborts after 15 seconds and clears the timeout', async () => {
    const fetchMock = vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = getCurrentWeather(validLocation)
    await vi.advanceTimersByTimeAsync(15_000)

    await expect(result).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})