export type LoadingStage = 'cities' | 'weather'

type StateContent = {
  title: string
  description?: string
  loading?: boolean
}

function renderState(container: HTMLElement, content: StateContent): void {
  container.setAttribute('aria-busy', String(content.loading ?? false))

  const state = document.createElement('section')
  state.className = 'weather-state'
  state.setAttribute('role', 'status')
  state.setAttribute('aria-live', 'polite')

  if (content.loading) {
    const indicator = document.createElement('span')
    indicator.className = 'weather-state__spinner'
    indicator.setAttribute('aria-hidden', 'true')
    state.append(indicator)
  }

  const title = document.createElement('h2')
  title.className = 'weather-state__title'
  title.textContent = content.title
  state.append(title)

  if (content.description) {
    const description = document.createElement('p')
    description.className = 'weather-state__description'
    description.textContent = content.description
    state.append(description)
  }

  container.replaceChildren(state)
}

export function renderInitialState(container: HTMLElement): void {
  renderState(container, {
    title: 'Consulte o clima de uma cidade',
    description: 'Digite uma cidade no campo acima para começar',
  })
}

export function renderLoadingState(container: HTMLElement, stage: LoadingStage): void {
  renderState(container, {
    title: stage === 'cities' ? 'Buscando cidades...' : 'Buscando clima...',
    loading: true,
  })
}

export function renderEmptyState(container: HTMLElement): void {
  renderState(container, {
    title: 'Nenhum resultado encontrado',
    description: 'Confira o nome da cidade e tente novamente',
  })
}