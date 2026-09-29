import './style.css'
import { renderEmptyState, renderLoadingState } from './components/basic-states'
import { renderLocationOptions } from './components/location-options'
import { mountSearchApp } from './components/search-form'
import { renderWeatherResult } from './components/weather-result'
import { getCurrentWeather, searchCities } from './services/open-meteo'
import type { WeatherLocation } from './types/weather'

const app = document.querySelector<HTMLElement>('#app')

if (app) {
  mountSearchApp(app, async (query: string) => {
    const input = app.querySelector<HTMLInputElement>('.search-form__input')
    const button = app.querySelector<HTMLButtonElement>('.search-form__button')
    const panel = app.querySelector<HTMLElement>('.weather-panel')

    if (!input || !button || !panel) return

    const setControlsDisabled = (disabled: boolean): void => {
      input.disabled = disabled
      button.disabled = disabled
    }

    const showEmptyResult = (currentQuery: string): void => {
      input.value = currentQuery
      setControlsDisabled(false)
      renderEmptyState(panel)
      input.focus()
    }

    const fetchWeatherForLocation = async (
      currentQuery: string,
      location: WeatherLocation,
    ): Promise<void> => {
      setControlsDisabled(true)
      renderLoadingState(panel, 'weather')

      try {
        const weather = await getCurrentWeather(location)
        if (!weather) {
          showEmptyResult(currentQuery)
          return
        }

        renderWeatherResult(panel, location, weather)
      } catch {
        showEmptyResult(currentQuery)
        return
      } finally {
        setControlsDisabled(false)
      }
    }

    input.value = query
    setControlsDisabled(true)
    renderLoadingState(panel, 'cities')

    try {
      const locations = await searchCities(query)

      if (!locations || locations.length === 0) {
        showEmptyResult(query)
        return
      }

      if (locations.length === 1) {
        await fetchWeatherForLocation(query, locations[0])
        return
      }

      setControlsDisabled(false)
      renderLocationOptions(panel, locations, async (location) => {
        await fetchWeatherForLocation(query, location)
      })
      input.focus()
    } catch {
      showEmptyResult(query)
    }
  })
}

