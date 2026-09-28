export type WeatherLocation = {
  id?: number
  name: string
  latitude: number
  longitude: number
  countryCode: string
  timezone: string
  country?: string
  admin1?: string
  admin2?: string
  admin3?: string
  admin4?: string
}

export type WeatherUnits = {
  temperature2m: string
  apparentTemperature: string
  relativeHumidity2m: string
  windSpeed10m: string
  windDirection10m: string
  precipitationProbability: string
  isDay: ''
}

export type CurrentWeather = {
  temperature2m: number
  apparentTemperature: number
  relativeHumidity2m: number
  isDay: 0 | 1
  windSpeed10m: number
  windDirection10m: number
  precipitationProbability: number
  weatherCode: number
  units: WeatherUnits
}

export type UnvalidatedData = unknown

export type WeatherState =
  | { status: 'idle' }
  | { status: 'loading'; stage: 'cities' | 'weather'; query: string }
  | { status: 'selecting'; query: string; options: WeatherLocation[] }
  | {
      status: 'success'
      query: string
      location: WeatherLocation
      weather: CurrentWeather
    }
  | { status: 'empty'; query: string }