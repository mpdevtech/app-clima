import type { CurrentWeather, WeatherLocation } from '../types/weather'

export const validLocation: WeatherLocation = {
  id: 3448439,
  name: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
  countryCode: 'BR',
  timezone: 'America/Sao_Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
}

export const homonymousLocations: WeatherLocation[] = [
  {
    id: 123,
    name: 'Bom Jardim',
    latitude: -4.74,
    longitude: -37.96,
    countryCode: 'BR',
    timezone: 'America/Fortaleza',
    country: 'Brasil',
    admin1: 'Ceará',
    admin2: 'Litoral de Aracati',
  },
  {
    id: 456,
    name: 'Bom Jardim',
    latitude: -4.15,
    longitude: -38.77,
    countryCode: 'BR',
    timezone: 'America/Fortaleza',
    country: 'Brasil',
    admin1: 'Ceará',
    admin2: 'Maciço de Baturité',
  },
]

export const completeWeather: CurrentWeather = {
  temperature2m: 24.6,
  apparentTemperature: 25.1,
  relativeHumidity2m: 68,
  isDay: 1,
  windSpeed10m: 12.4,
  windDirection10m: 180,
  precipitationProbability: 20,
  weatherCode: 2,
  units: {
    temperature2m: '°C',
    apparentTemperature: '°C',
    relativeHumidity2m: '%',
    windSpeed10m: 'km/h',
    windDirection10m: '°',
    precipitationProbability: '%',
    isDay: '',
  },
}

export const zeroWeather: CurrentWeather = {
  temperature2m: 0,
  apparentTemperature: 0,
  relativeHumidity2m: 0,
  isDay: 0,
  windSpeed10m: 0,
  windDirection10m: 0,
  precipitationProbability: 0,
  weatherCode: 0,
  units: { ...completeWeather.units },
}