import { describe, expect, it } from 'vitest'
import { formatCurrentDate, formatWeatherNumber } from '../utils/formatters'
import { getWeatherDescription } from '../utils/weather-code'
import { completeWeather, zeroWeather } from './fixtures'

describe('getWeatherDescription', () => {
  it.each([
    [0, 'Céu limpo'],
    [1, 'Predominantemente limpo'],
    [2, 'Parcialmente nublado'],
    [3, 'Encoberto'],
    [45, 'Nevoeiro'],
    [48, 'Nevoeiro com formação de geada'],
    [51, 'Garoa leve'],
    [53, 'Garoa moderada'],
    [55, 'Garoa intensa'],
    [56, 'Garoa congelante leve'],
    [57, 'Garoa congelante intensa'],
    [61, 'Chuva leve'],
    [63, 'Chuva moderada'],
    [65, 'Chuva forte'],
    [66, 'Chuva congelante leve'],
    [67, 'Chuva congelante forte'],
    [71, 'Neve leve'],
    [73, 'Neve moderada'],
    [75, 'Neve forte'],
    [77, 'Grãos de neve'],
    [80, 'Pancadas de chuva leves'],
    [81, 'Pancadas de chuva moderadas'],
    [82, 'Pancadas de chuva intensas'],
    [85, 'Pancadas de neve leves'],
    [86, 'Pancadas de neve fortes'],
    [95, 'Trovoada'],
    [96, 'Trovoada com granizo leve'],
    [97, 'Trovoada forte'],
    [99, 'Trovoada com granizo forte'],
  ])('describes weather code %i in Portuguese', (code, description) => {
    expect(getWeatherDescription(code, 1).description).toBe(description)
  })

  it.each([
    [0, 'sun', 'moon'],
    [1, 'cloud-sun', 'cloud-moon'],
    [2, 'cloud-sun', 'cloud-moon'],
  ] as const)('uses is_day for day and night icons on code %i', (code, dayIcon, nightIcon) => {
    expect(getWeatherDescription(code, 1).icon).toBe(dayIcon)
    expect(getWeatherDescription(code, 0).icon).toBe(nightIcon)
  })

  it('returns a neutral description and icon for an unknown code', () => {
    expect(getWeatherDescription(1234, 1)).toEqual({
      description: 'Condição meteorológica desconhecida',
      icon: 'cloud-question',
    })
  })
})

describe('formatWeatherNumber', () => {
  it('formats decimals and grouping using pt-BR without changing source values', () => {
    const temperature = completeWeather.temperature2m
    const humidity = completeWeather.relativeHumidity2m
    const speed = completeWeather.windSpeed10m

    expect(formatWeatherNumber(temperature, 1)).toBe('24,6')
    expect(formatWeatherNumber(-1234.56, 1)).toBe('-1.234,6')
    expect(formatWeatherNumber(humidity, 0)).toBe('68')
    expect(formatWeatherNumber(speed, 1)).toBe('12,4')
    expect(formatWeatherNumber(0, 0)).toBe('0')
    expect(completeWeather.temperature2m).toBe(temperature)
    expect(completeWeather.relativeHumidity2m).toBe(humidity)
    expect(completeWeather.windSpeed10m).toBe(speed)
    expect(zeroWeather.temperature2m).toBe(0)
  })
})

describe('formatCurrentDate', () => {
  it('derives the local calendar day from the supplied timezone', () => {
    const nearMidnightUtc = new Date('2026-09-29T00:30:00.000Z')

    expect(formatCurrentDate('America/Los_Angeles', nearMidnightUtc)).toBe(
      'segunda-feira, 28 de setembro de 2026',
    )
    expect(formatCurrentDate('Asia/Tokyo', nearMidnightUtc)).toBe(
      'terça-feira, 29 de setembro de 2026',
    )
  })
})