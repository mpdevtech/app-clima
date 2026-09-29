import './style.css'
import { mountSearchApp } from './components/search-form'

const app = document.querySelector<HTMLElement>('#app')
if (app) mountSearchApp(app)

