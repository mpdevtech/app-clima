// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderLocationOptions } from '../components/location-options'
import { homonymousLocations, validLocation } from './fixtures'
import type { WeatherLocation } from '../types/weather'

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

function render(options: readonly WeatherLocation[], onSelect = vi.fn()) {
  const container = document.createElement('section')
  document.body.append(container)
  renderLocationOptions(container, options, onSelect)
  return { container, onSelect }
}

describe('seleção de localizações', () => {
  it('preserva a ordem e apresenta cada opção como botão independente', () => {
    const options = [validLocation, ...homonymousLocations]
    const { container } = render(options)
    const buttons = container.querySelectorAll<HTMLButtonElement>('button')

    expect(buttons).toHaveLength(3)
    expect([...buttons].map((button) => button.querySelector('.location-options__name')?.textContent))
      .toEqual(options.map((option) => option.name))
    expect(buttons[1].textContent).toContain('Litoral de Aracati')
    expect(buttons[2].textContent).toContain('Maciço de Baturité')
  })

  it('acrescenta coordenadas quando os identificadores administrativos coincidem', () => {
    const duplicated = [
      { ...validLocation, admin1: 'RS', admin2: 'Porto Alegre' },
      { ...validLocation, latitude: -23.56, longitude: -46.64, admin1: 'RS', admin2: 'Porto Alegre' },
    ]
    const { container } = render(duplicated)
    const buttons = container.querySelectorAll('button')

    expect(buttons[0].textContent).toContain('lat -23.55, lon -46.63')
    expect(buttons[1].textContent).toContain('lat -23.56, lon -46.64')
  })

  it('usa o código do país como fallback sem exibir campos opcionais ausentes', () => {
    const location: WeatherLocation = {
      name: '<Porto>',
      latitude: 0,
      longitude: 0,
      countryCode: 'BR',
      timezone: 'America/Sao_Paulo',
    }
    const { container } = render([location])
    const button = container.querySelector('button')!

    expect(button.querySelector('.location-options__name')?.textContent).toBe('<Porto>')
    expect(button.querySelector('.location-options__details')?.textContent).toBe('BR')
    expect(button.textContent).not.toContain('undefined')
    expect(container.querySelector('script')).toBeNull()
  })

  it('liga cada botão ao objeto correto, mesmo quando os nomes se repetem', () => {
    const onSelect = vi.fn()
    const { container } = render(homonymousLocations, onSelect)
    const buttons = container.querySelectorAll<HTMLButtonElement>('button')

    buttons[1].click()

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(homonymousLocations[1])
    expect(onSelect.mock.calls[0][0]).toBe(homonymousLocations[1])
  })

  it('anuncia a disponibilidade, foca a primeira opção e não mantém loading', () => {
    const { container } = render(homonymousLocations)

    expect(container.querySelector('h2')?.textContent).toBe('Selecione a localização')
    expect(container.querySelector('[role="status"]')?.textContent).toBe('2 opções disponíveis.')
    expect(container.getAttribute('aria-busy')).toBe('false')
    expect(container.querySelector('.weather-state__spinner')).toBeNull()
    expect(document.activeElement).toBe(container.querySelector('button'))
  })
})