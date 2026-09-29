// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const weatherPayload = {
  current: {
    temperature_2m: 24.6,
    apparent_temperature: 25.1,
    relative_humidity_2m: 68,
    is_day: 1,
    wind_speed_10m: 12.4,
    wind_direction_10m: 180,
    precipitation_probability: 20,
    weather_code: 2,
  },
  current_units: {
    temperature_2m: '°C',
    apparent_temperature: '°C',
    relative_humidity_2m: '%',
    is_day: '',
    wind_speed_10m: 'km/h',
    wind_direction_10m: '°',
    precipitation_probability: '%',
    weather_code: '',
  },
}

describe('weather search flow', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = '<div id="app"></div>'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches weather automatically after a single valid city result', async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            name: 'São Paulo',
            latitude: -23.55,
            longitude: -46.63,
            country_code: 'BR',
            timezone: 'America/Sao_Paulo',
            country: 'Brasil',
            admin1: 'São Paulo',
          },
        ],
      }),
    } as Response)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => weatherPayload,
    } as Response)

    await import('../main')

    const form = document.querySelector<HTMLFormElement>('.search-form')!
    const input = document.querySelector<HTMLInputElement>('.search-form__input')!
    input.value = 'São Paulo'
    form.requestSubmit()

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(document.querySelector('.weather-summary__city')?.textContent).toContain('São Paulo')
    })
  })

  it('shows location options and fetches the selected city weather', async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            name: 'Bom Jardim',
            latitude: -4.74,
            longitude: -37.96,
            country_code: 'BR',
            timezone: 'America/Fortaleza',
            country: 'Brasil',
            admin1: 'Ceará',
          },
          {
            name: 'Bom Jardim',
            latitude: -4.15,
            longitude: -38.77,
            country_code: 'BR',
            timezone: 'America/Fortaleza',
            country: 'Brasil',
            admin1: 'Ceará',
            admin2: 'Maciço de Baturité',
          },
        ],
      }),
    } as Response)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => weatherPayload,
    } as Response)

    await import('../main')

    const form = document.querySelector<HTMLFormElement>('.search-form')!
    const input = document.querySelector<HTMLInputElement>('.search-form__input')!
    input.value = 'Bom Jardim'
    form.requestSubmit()

    await vi.waitFor(() => {
      const buttons = [...document.querySelectorAll<HTMLButtonElement>('.location-options__button')]
      expect(buttons).toHaveLength(2)
    })

    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.location-options__button')]
    buttons[1].click()

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(document.querySelector('.weather-result')).not.toBeNull()
    })
  })

  it('clears failed results, allows retry, and skips weather when no city is found', async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch)
    const cityResult = {
      name: 'São Paulo',
      latitude: -23.55,
      longitude: -46.63,
      country_code: 'BR',
      timezone: 'America/Sao_Paulo',
    }
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [cityResult] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => weatherPayload } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [cityResult] }),
      } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [cityResult] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => weatherPayload } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) } as Response)

    await import('../main')

    const form = document.querySelector<HTMLFormElement>('.search-form')!
    const input = document.querySelector<HTMLInputElement>('.search-form__input')!
    input.value = 'São Paulo'
    form.requestSubmit()

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(document.querySelector('.weather-result')).not.toBeNull()
    })

    form.requestSubmit()

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4)
      expect(document.body.textContent).toContain('Nenhum resultado encontrado')
    })
    expect(input.value).toBe('São Paulo')
    expect(input.disabled).toBe(false)
    expect(document.querySelector('[data-metric]')).toBeNull()

    form.requestSubmit()

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(6)
      expect(document.querySelector('.weather-result')).not.toBeNull()
    })

    input.value = 'Cidade inexistente'
    form.requestSubmit()

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(7)
      expect(document.body.textContent).toContain('Nenhum resultado encontrado')
    })
    expect(document.querySelector('.weather-result')).toBeNull()
  })

  it('replaces unselected locations when the user starts a new search', async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch)
    const oldLocations = [
      {
        name: 'Springfield',
        latitude: 1,
        longitude: 2,
        country_code: 'BR',
        timezone: 'America/Sao_Paulo',
        admin1: 'São Paulo',
      },
      {
        name: 'Springfield',
        latitude: 3,
        longitude: 4,
        country_code: 'BR',
        timezone: 'America/Sao_Paulo',
        admin1: 'São Paulo',
      },
    ]
    const newLocation = {
      name: 'Porto Alegre',
      latitude: -30.03,
      longitude: -51.23,
      country_code: 'BR',
      timezone: 'America/Sao_Paulo',
    }
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: oldLocations }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [newLocation] }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => weatherPayload } as Response)

    await import('../main')

    const form = document.querySelector<HTMLFormElement>('.search-form')!
    const input = document.querySelector<HTMLInputElement>('.search-form__input')!
    input.value = 'Springfield'
    form.requestSubmit()

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.location-options__button')).toHaveLength(2)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    input.value = 'Porto Alegre'
    form.requestSubmit()

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(document.querySelector('.weather-result')).not.toBeNull()
    })
    expect(document.querySelectorAll('.location-options__button')).toHaveLength(0)
    expect(document.querySelector('.weather-summary__city')?.textContent).toContain('Porto Alegre')
    expect(new URL(fetchMock.mock.calls[2][0] as string).searchParams.get('latitude')).toBe(
      String(newLocation.latitude),
    )
  })

  it('does not submit again while the weather request is pending', async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch)
    const cityResult = {
      name: 'São Paulo',
      latitude: -23.55,
      longitude: -46.63,
      country_code: 'BR',
      timezone: 'America/Sao_Paulo',
    }
    let resolveWeather!: (response: Response) => void
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [cityResult] }),
      } as Response)
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveWeather = resolve
          }),
      )

    await import('../main')

    const form = document.querySelector<HTMLFormElement>('.search-form')!
    const input = document.querySelector<HTMLInputElement>('.search-form__input')!
    const button = document.querySelector<HTMLButtonElement>('.search-form__button')!
    input.value = 'São Paulo'
    form.requestSubmit()

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(input.disabled).toBe(true)
    expect(button.disabled).toBe(true)
    button.click()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    resolveWeather({ ok: true, json: async () => weatherPayload } as Response)
    await vi.waitFor(() => expect(document.querySelector('.weather-result')).not.toBeNull())
    expect(input.disabled).toBe(false)
    expect(button.disabled).toBe(false)
  })
})
