import type { WeatherLocation } from '../types/weather'

export type LocationSelectHandler = (location: WeatherLocation) => void

function locationDetails(location: WeatherLocation): string {
  const parts = [
    location.admin1,
    location.admin2,
    location.admin3,
    location.admin4,
    location.country || location.countryCode,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part) && part !== location.name)

  return [...new Set(parts)].join(', ')
}

function optionLabels(options: readonly WeatherLocation[]): string[] {
  const labels = options.map((location) => {
    const details = locationDetails(location)
    return details ? `${location.name} · ${details}` : location.name
  })
  const counts = new Map<string, number>()
  labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1))

  return labels.map((label, index) => {
    if ((counts.get(label) ?? 0) < 2) return label
    const location = options[index]
    return `${label} · lat ${location.latitude}, lon ${location.longitude}`
  })
}

export function renderLocationOptions(
  container: HTMLElement,
  options: readonly WeatherLocation[],
  onSelect: LocationSelectHandler,
): void {
  container.setAttribute('aria-busy', 'false')

  const section = document.createElement('section')
  section.className = 'location-selection'

  const heading = document.createElement('h2')
  heading.className = 'location-selection__title'
  heading.textContent = 'Selecione a localização'

  const announcement = document.createElement('p')
  announcement.className = 'location-selection__announcement'
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.textContent = `${options.length} ${options.length === 1 ? 'opção disponível' : 'opções disponíveis'}.`

  const list = document.createElement('ul')
  list.className = 'location-options'
  list.setAttribute('aria-label', 'Opções de localização')

  const labels = optionLabels(options)
  options.forEach((location, index) => {
    const item = document.createElement('li')
    item.className = 'location-options__item'

    const button = document.createElement('button')
    button.className = 'location-options__button'
    button.type = 'button'

    const name = document.createElement('span')
    name.className = 'location-options__name'
    name.textContent = location.name

    const details = document.createElement('span')
    details.className = 'location-options__details'
    details.textContent = labels[index].slice(location.name.length).replace(/^ · /, '')

    button.append(name, details)
    button.addEventListener('click', () => onSelect(location))
    item.append(button)
    list.append(item)
  })

  section.append(heading, announcement, list)
  container.replaceChildren(section)
  list.querySelector<HTMLButtonElement>('button')?.focus()
}