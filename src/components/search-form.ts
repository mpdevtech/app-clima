import { renderInitialState } from './basic-states'

export type SearchHandler = (query: string) => void

export function mountSearchApp(root: HTMLElement, onSearch: SearchHandler = () => {}): void {
  root.innerHTML = `
    <div class="weather-app">
      <form class="search-form">
        <label class="search-form__label" for="city-search">Cidade</label>
        <div class="search-form__control">
          <input
            class="search-form__input"
            id="city-search"
            name="city"
            type="text"
            placeholder="Digite o nome da cidade"
            autocomplete="off"
          />
          <button class="search-form__button" type="submit" aria-label="Buscar clima">
            Buscar
          </button>
        </div>
      </form>
      <section class="weather-panel" aria-label="Condições meteorológicas" aria-busy="false"></section>
    </div>
  `

  const form = root.querySelector<HTMLFormElement>('.search-form')
  const input = root.querySelector<HTMLInputElement>('.search-form__input')
  const panel = root.querySelector<HTMLElement>('.weather-panel')
  if (!form || !input || !panel) return

  renderInitialState(panel)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const query = input.value.trim()
    if (!query) {
      renderInitialState(panel)
      input.focus()
      return
    }

    onSearch(query)
  })
}