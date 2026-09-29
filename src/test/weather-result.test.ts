// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWeatherResult } from '../components/weather-result'
import { completeWeather, validLocation, zeroWeather } from './fixtures'
import type { CurrentWeather, WeatherLocation } from '../types/weather'

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function render(
  location: WeatherLocation = validLocation,
  weather: CurrentWeather = completeWeather,
) {
  const container = document.createElement('section')
  document.body.append(container)
  renderWeatherResult(container, location, weather)
  return container
}

describe('painel do clima', () => {
  it('apresenta resumo, quatro métricas completas, unidades e atribuição', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const container = render()

    expect(container.querySelector('.weather-summary__temperature')?.textContent).toBe('24,6°C')
    expect(container.querySelector('.weather-summary__temperature')?.getAttribute('aria-label'))
      .toBe('Temperatura atual: 24,6°C')
    expect(container.querySelector('.weather-summary__city')?.textContent).toBe('São Paulo, BR')
    expect(container.querySelector('.weather-summary__day-period')?.textContent).toContain('Dia')
    expect(container.querySelector('.weather-summary__condition')?.textContent).toContain('Parcialmente nublado')
    expect([...container.querySelectorAll('dt')].map((term) => term.textContent)).toEqual([
      'Umidade relativa',
      'Sensação térmica',
      'Probabilidade de precipitação',
      'Vento',
    ])
    expect([...container.querySelectorAll('dd')].map((value) => value.textContent)).toEqual([
      '68 %',
      '25,1°C',
      '20 %',
      '12,4 km/h · 180°',
    ])
    expect(container.querySelector('.weather-result__attribution a')?.getAttribute('href')).toBe(
      'https://open-meteo.com/',
    )
    expect(container.getAttribute('aria-busy')).toBe('false')
    expect(container.querySelector('.weather-result')?.getAttribute('aria-live')).toBe('polite')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('preserva zeros e negativos, e usa ícone de noite para is_day igual a zero', () => {
    const weather: CurrentWeather = {
      ...zeroWeather,
      temperature2m: -3.4,
      apparentTemperature: -5.2,
      weatherCode: 0,
    }
    const container = render(validLocation, weather)

    expect(container.querySelector('.weather-summary__temperature')?.textContent).toBe('-3,4°C')
    expect(container.querySelector('.weather-summary__day-period')?.textContent).toContain('Noite')
    expect(container.querySelector('.weather-summary__day-period .weather-icon')?.textContent).toBe('☾')
    expect([...container.querySelectorAll('dd')].map((value) => value.textContent)).toEqual([
      '0 %',
      '-5,2°C',
      '0 %',
      '0 km/h · 0°',
    ])
  })

  it('usa texto e ícone neutros para código desconhecido', () => {
    const container = render(validLocation, { ...completeWeather, weatherCode: 1000 })

    expect(container.querySelector('.weather-summary__condition')?.textContent).toContain(
      'Condição meteorológica desconhecida',
    )
    expect(container.querySelector('.weather-summary__condition .weather-icon')?.textContent).toBe('?')
  })

  it('formata a data com o timezone da localização', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-28T00:30:00.000Z'))
    const location = { ...validLocation, timezone: 'America/Los_Angeles' }

    expect(render(location).querySelector('.weather-summary__date')?.textContent).toContain('domingo, 27 de setembro de 2026')
  })

  it('exibe o nome da cidade como texto sem interpretar marcação HTML', () => {
    const location = { ...validLocation, name: '<img src=x onerror=alert(1)>' }
    const container = render(location)

    expect(container.querySelector('.weather-summary__city')?.textContent).toBe(
      '<img src=x onerror=alert(1)>, BR',
    )
    expect(container.querySelector('.weather-summary__city img')).toBeNull()
  })
})