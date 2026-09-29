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
})
