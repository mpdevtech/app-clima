// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  renderEmptyState,
  renderInitialState,
  renderLoadingState,
} from '../components/basic-states'
import { mountSearchApp } from '../components/search-form'

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

function mount(): HTMLElement {
  const root = document.createElement('main')
  document.body.append(root)
  mountSearchApp(root)
  return root
}

describe('formulário e estados básicos', () => {
  it('exibe o formulário rotulado e o estado inicial sem consultar a API', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const root = mount()

    expect(root.querySelector('label')?.textContent).toBe('Cidade')
    expect(root.querySelector('label')?.htmlFor).toBe('city-search')
    expect(root.querySelector('input')?.placeholder).toBe('Digite o nome da cidade')
    expect(root.querySelector('button')?.getAttribute('aria-label')).toBe('Buscar clima')
    expect(root.textContent).toContain('Consulte o clima de uma cidade')
    expect(root.textContent).toContain('Digite uma cidade no campo acima para começar')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('não consulta ao digitar e mantém o estado inicial e o foco ao enviar espaços', () => {
    const onSearch = vi.fn()
    const root = document.createElement('main')
    document.body.append(root)
    mountSearchApp(root, onSearch)
    const input = root.querySelector<HTMLInputElement>('input')!
    const form = root.querySelector<HTMLFormElement>('form')!

    input.value = '   '
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(onSearch).not.toHaveBeenCalled()

    form.requestSubmit()

    expect(root.textContent).toContain('Consulte o clima de uma cidade')
    expect(document.activeElement).toBe(input)
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('usa o mesmo submit para clique e envio pelo teclado, normalizando espaços', () => {
    const onSearch = vi.fn()
    const root = document.createElement('main')
    document.body.append(root)
    mountSearchApp(root, onSearch)
    const input = root.querySelector<HTMLInputElement>('input')!
    const form = root.querySelector<HTMLFormElement>('form')!
    const button = root.querySelector<HTMLButtonElement>('button')!

    input.value = '  Porto Alegre  '
    button.click()
    form.requestSubmit()

    expect(onSearch).toHaveBeenNthCalledWith(1, 'Porto Alegre')
    expect(onSearch).toHaveBeenNthCalledWith(2, 'Porto Alegre')
  })

  it.each([
    ['cities', 'Buscando cidades...'],
    ['weather', 'Buscando clima...'],
  ] as const)('renderiza loading de %s com região de status ocupada', (stage, message) => {
    const container = document.createElement('section')
    renderLoadingState(container, stage)

    expect(container.textContent).toContain(message)
    expect(container.getAttribute('aria-busy')).toBe('true')
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite')
    expect(container.querySelector('.weather-state__spinner')).toBeTruthy()
    expect(container.querySelector('[data-metric]')).toBeNull()
  })

  it('renderiza o estado sem resultado sem métricas e sem busy', () => {
    const container = document.createElement('section')
    renderEmptyState(container)

    expect(container.textContent).toContain('Nenhum resultado encontrado')
    expect(container.textContent).toContain('Confira o nome da cidade e tente novamente')
    expect(container.getAttribute('aria-busy')).toBe('false')
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite')
    expect(container.querySelector('[data-metric]')).toBeNull()
  })

  it('pode restaurar o estado inicial isoladamente', () => {
    const container = document.createElement('section')
    renderEmptyState(container)
    renderInitialState(container)

    expect(container.textContent).toContain('Consulte o clima de uma cidade')
    expect(container.getAttribute('aria-busy')).toBe('false')
  })
})