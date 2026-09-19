import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { COLOR_PRIMARIO, COLOR_SECUNDARIO, COLOR_FONDO } from './config'

const valido = (v: string, fallback: string): string =>
  v && !v.startsWith('{{') ? v : fallback

const root = document.documentElement
root.style.setProperty('--color-primary', valido(COLOR_PRIMARIO, '#000000'))
root.style.setProperty('--color-secondary', valido(COLOR_SECUNDARIO, '#D4AF37'))
root.style.setProperty('--color-light', '#f0f0f0')
root.style.setProperty('--color-fondo', valido(COLOR_FONDO, '#000000'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
