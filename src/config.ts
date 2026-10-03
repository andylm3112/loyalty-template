const env = import.meta.env

const texto = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() !== '' ? v : fallback

export const NOMBRE_NEGOCIO: string = texto(env.VITE_NOMBRE_NEGOCIO, 'Mi Negocio')
export const SLOGAN: string = texto(env.VITE_SLOGAN)
export const COLOR_PRIMARIO: string = texto(env.VITE_COLOR_PRIMARIO, '#000000')
export const COLOR_SECUNDARIO: string = texto(env.VITE_COLOR_SECUNDARIO, '#D4AF37')
export const COLOR_FONDO: string = texto(env.VITE_COLOR_FONDO, '#000000')
export const LOGO_URL: string = texto(env.VITE_LOGO_URL)
export const BANNER_URL: string = texto(env.VITE_BANNER_URL)
export const PUNTOS_META: number = Number(env.VITE_PUNTOS_META) || 4
export const WHATSAPP: string = texto(env.VITE_WHATSAPP)
export const INSTAGRAM: string = texto(env.VITE_INSTAGRAM)
export const MODO_DEMO: boolean = String(env.VITE_MODO_DEMO) === 'true'