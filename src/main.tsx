import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { COLOR_PRIMARIO, COLOR_SECUNDARIO, COLOR_FONDO } from './config'

const valido = (v: string, fallback: string): string =>
  v && !v.startsWith('{{') ? v : fallback

const hexToRgb = (hex: string): string => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(n)) return '0 0 0'
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const primario = valido(COLOR_PRIMARIO, '#000000')
const secundario = valido(COLOR_SECUNDARIO, '#D4AF37')
const luz = '#f0f0f0'

const root = document.documentElement
root.style.setProperty('--color-primary', primario)
root.style.setProperty('--color-primary-rgb', hexToRgb(primario))
root.style.setProperty('--color-secondary', secundario)
root.style.setProperty('--color-secondary-rgb', hexToRgb(secundario))
root.style.setProperty('--color-light', luz)
root.style.setProperty('--color-light-rgb', hexToRgb(luz))
root.style.setProperty('--color-fondo', valido(COLOR_FONDO, '#000000'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
