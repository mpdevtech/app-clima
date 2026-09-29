import type { CurrentWeather, WeatherLocation } from '../types/weather'
import { formatCurrentDate, formatWeatherNumber } from '../utils/formatters'
import { getWeatherDescription, type WeatherIcon } from '../utils/weather-code'

const iconGlyphs: Record<WeatherIcon, string> = {
  sun: '☀',
  moon: '☾',
  'cloud-sun': '☼',
  'cloud-moon': '☾',
  cloud: '☁',
  fog: '≋',
  'cloud-drizzle': '☂',
  'cloud-hail': '❄',
  'cloud-rain': '☂',
  snowflake: '❄',
  'cloud-snow': '❄',
  'cloud-lightning': 'ϟ',
  'cloud-question': '?',
}

function createIcon(icon: WeatherIcon, className: string): HTMLSpanElement {
  const element = document.createElement('span')
  element.className = className
  element.setAttribute('aria-hidden', 'true')
  element.textContent = iconGlyphs[icon]
  return element
}

function createMetric(label: string, value: string, accessibleValue = value): HTMLElement {
  const item = document.createElement('div')
  item.className = 'weather-metric'

  const term = document.createElement('dt')
  term.className = 'weather-metric__label'
  term.textContent = label

  const description = document.createElement('dd')
  description.className = 'weather-metric__value'
  description.setAttribute('aria-label', accessibleValue)
  description.textContent = value

  item.append(term, description)
  return item
}

export function renderWeatherResult(
  container: HTMLElement,
  location: WeatherLocation,
  weather: CurrentWeather,
): void {
  container.setAttribute('aria-busy', 'false')

  const result = document.createElement('section')
  result.className = 'weather-result'
  result.setAttribute('role', 'region')
  result.setAttribute('aria-label', `Clima em ${location.name}, ${location.countryCode}`)
  result.setAttribute('aria-live', 'polite')

  const summary = document.createElement('aside')
  summary.className = 'weather-summary'

  const temperature = document.createElement('p')
  temperature.className = 'weather-summary__temperature'
  temperature.textContent = `${formatWeatherNumber(weather.temperature2m, 1)}${weather.units.temperature2m}`
  temperature.setAttribute('aria-label', `Temperatura atual: ${temperature.textContent}`)

  const city = document.createElement('h2')
  city.className = 'weather-summary__city'
  city.textContent = `${location.name}, ${location.countryCode}`

  const date = document.createElement('p')
  date.className = 'weather-summary__date'
  date.textContent = formatCurrentDate(location.timezone)

  const dayPeriod = document.createElement('p')
  dayPeriod.className = 'weather-summary__day-period'
  const dayIcon = weather.isDay === 1 ? 'sun' : 'moon'
  dayPeriod.append(createIcon(dayIcon, 'weather-icon weather-icon--day-period'))
  dayPeriod.append(document.createTextNode(weather.isDay === 1 ? 'Dia' : 'Noite'))

  const conditionInfo = getWeatherDescription(weather.weatherCode, weather.isDay)
  const condition = document.createElement('p')
  condition.className = 'weather-summary__condition'
  condition.append(createIcon(conditionInfo.icon, 'weather-icon weather-icon--condition'))
  const conditionText = document.createElement('span')
  conditionText.textContent = conditionInfo.description
  condition.append(conditionText)

  summary.append(temperature, city, date, dayPeriod, condition)

  const metrics = document.createElement('dl')
  metrics.className = 'weather-metrics'
  const windValue = `${formatWeatherNumber(weather.windSpeed10m, 1)} ${weather.units.windSpeed10m} · ${formatWeatherNumber(weather.windDirection10m, 0)}${weather.units.windDirection10m}`
  const windAccessibleValue = `${formatWeatherNumber(weather.windSpeed10m, 1)} ${weather.units.windSpeed10m}, direção ${formatWeatherNumber(weather.windDirection10m, 0)}${weather.units.windDirection10m}`

  metrics.append(
    createMetric(
      'Umidade relativa',
      `${formatWeatherNumber(weather.relativeHumidity2m, 0)} ${weather.units.relativeHumidity2m}`,
    ),
    createMetric(
      'Sensação térmica',
      `${formatWeatherNumber(weather.apparentTemperature, 1)}${weather.units.apparentTemperature}`,
    ),
    createMetric(
      'Probabilidade de precipitação',
      `${formatWeatherNumber(weather.precipitationProbability, 0)} ${weather.units.precipitationProbability}`,
    ),
    createMetric('Vento', windValue, windAccessibleValue),
  )

  const attribution = document.createElement('footer')
  attribution.className = 'weather-result__attribution'
  attribution.append(document.createTextNode('Dados meteorológicos fornecidos por '))
  const provider = document.createElement('a')
  provider.href = 'https://open-meteo.com/'
  provider.textContent = 'Open-Meteo'
  attribution.append(provider)

  result.append(summary, metrics, attribution)
  container.replaceChildren(result)
}