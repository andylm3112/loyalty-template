import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BANNER_URL, COLOR_FONDO, INSTAGRAM, LOGO_URL, NOMBRE_NEGOCIO, SLOGAN, WHATSAPP } from '../config'
import TarjetaCliente from './TarjetaCliente'
import type { Cliente } from '../types'

const LOGO_DEFAULT = '/no_bg_image.png'
const LIMITE_REFERIDOS_POR_MES = 5

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  return fallback
}

function normalizarTelefono(valor: string) {
  return valor.replace(/\D/g, '')
}

function esTelefonoValido(valor: string) {
  const digitos = normalizarTelefono(valor)
  return digitos.length >= 9 && digitos.length <= 15
}

export default function ClienteHome() {
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [referidoPor, setReferidoPor] = useState('')
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [mostrarFormularioRegistro, setMostrarFormularioRegistro] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [negocioActivo, setNegocioActivo] = useState<boolean | null>(null)

  const logoSrc = LOGO_URL && !LOGO_URL.startsWith('{{') ? LOGO_URL : LOGO_DEFAULT
  const bannerSrc = BANNER_URL && !BANNER_URL.startsWith('{{') ? BANNER_URL : null
  const colorFondo = COLOR_FONDO && !COLOR_FONDO.startsWith('{{') ? COLOR_FONDO : null

  const estiloFondo: React.CSSProperties = bannerSrc
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${bannerSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : colorFondo
    ? { backgroundColor: colorFondo }
    : {}

  useEffect(() => {
    void verificarNegocioActivo()
  }, [])

  const verificarNegocioActivo = async () => {
    const { data, error } = await supabase
      .from('negocios')
      .select('activo')
      .eq('nombre', NOMBRE_NEGOCIO)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      setNegocioActivo(true)
      return
    }

    setNegocioActivo(data.activo !== false)
  }

  const buscarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMostrarFormularioRegistro(false)

    const telefonoNormalizado = normalizarTelefono(telefono)

    if (!esTelefonoValido(telefonoNormalizado)) {
      setError('El teléfono debe tener entre 9 y 15 dígitos.')
      setLoading(false)
      return
    }

    setTelefono(telefonoNormalizado)

    try {
      const { data: administradores, error: errorAdmin } = await supabase
        .from('administradores')
        .select('*')
        .eq('telefono', telefonoNormalizado)
        .limit(1)

      if (errorAdmin) throw errorAdmin
      const esAdmin = administradores?.[0]

      if (esAdmin) {
        setError('Los administradores no pueden ser clientes')
        setLoading(false)
        return
      }

      const { data: clientes, error: errorBusqueda } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefono', telefonoNormalizado)
        .limit(1)

      if (errorBusqueda) {
        throw errorBusqueda
      }

      const clienteExistente = clientes?.[0]

      if (clienteExistente) {
        setCliente(clienteExistente as Cliente)
      } else {
        setMostrarFormularioRegistro(true)
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al buscar cliente'))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Resuelve el id del cliente referente a partir del teléfono capturado en el
   * formulario, aplicando las reglas anti-abuso:
   * - Auto-referido (mismo teléfono) → sin premio
   * - Teléfono inventado (no existe en clientes) → sin premio
   * - Teléfono pertenece a un administrador → sin premio
   * - Referente ya alcanzó su límite mensual de referidos → sin premio
   * Devuelve null si no aplica ningún premio de referido.
   */
  const resolverReferenteId = async (
    telefonoReferido: string,
    telefonoPropio: string,
    negocioId: string
  ): Promise<string | null> => {
    const telReferidoDigits = normalizarTelefono(telefonoReferido)

    if (!telReferidoDigits || telReferidoDigits === telefonoPropio) {
      return null
    }

    const { data: adminsConEseTelefono } = await supabase
      .from('administradores')
      .select('id')
      .eq('telefono', telReferidoDigits)
      .limit(1)

    if (adminsConEseTelefono && adminsConEseTelefono.length > 0) {
      return null
    }

    const { data: referentes } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', telReferidoDigits)
      .eq('negocio_id', negocioId)
      .limit(1)

    const referente = referentes?.[0]
    if (!referente) {
      return null
    }

    const primerDiaMes = new Date()
    primerDiaMes.setDate(1)
    primerDiaMes.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('referido_por', referente.id)
      .gte('created_at', primerDiaMes.toISOString())

    if ((count || 0) >= LIMITE_REFERIDOS_POR_MES) {
      return null
    }

    return referente.id
  }

  const registrarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: negocios, error: errorNegocio } = await supabase
        .from('negocios')
        .select('id')
        .eq('nombre', NOMBRE_NEGOCIO)
        .limit(1)

      if (errorNegocio) throw errorNegocio
      const negocio = negocios?.[0]
      
      if (!negocio) {
        throw new Error('Negocio no encontrado')
      }

      const telefonoNormalizado = normalizarTelefono(telefono)
      const referenteId = await resolverReferenteId(referidoPor, telefonoNormalizado, negocio.id)

      const { data: nuevosClientes, error: errorRegistro } = await supabase
        .from('clientes')
        .insert({
          negocio_id: negocio.id,
          nombre: nombre.trim(),
          telefono: telefonoNormalizado,
          puntos: 0,
          referido_por: referenteId,
        })
        .select()

      if (errorRegistro) throw errorRegistro

      const nuevoCliente = nuevosClientes?.[0]
      if (!nuevoCliente) {
        throw new Error('Error al registrar cliente')
      }

      setCliente(nuevoCliente as Cliente)
      setMostrarFormularioRegistro(false)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al registrar cliente'))
    } finally {
      setLoading(false)
    }
  }

  const handleVolverBusqueda = () => {
    setCliente(null)
    setMostrarFormularioRegistro(false)
    setTelefono('')
    setNombre('')
    setReferidoPor('')
    setError(null)
  }

  const handleVolverDesdeRegistro = () => {
    setMostrarFormularioRegistro(false)
    setNombre('')
    setReferidoPor('')
    setError(null)
  }

  if (negocioActivo === null) {
    return (
      <div className="min-h-screen text-light flex items-center justify-center" style={estiloFondo}>
        <div className="animate-spin h-12 w-12 border-4 border-secondary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (negocioActivo === false) {
    return (
      <div className="min-h-screen text-light flex items-center justify-center p-6" style={estiloFondo}>
        <div className="max-w-md w-full text-center">
          <img src={logoSrc} alt={NOMBRE_NEGOCIO} className="h-20 mx-auto mb-6 object-contain" />
          <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <p className="text-red-300 font-bold">Este servicio no está disponible actualmente.</p>
          </div>
        </div>
      </div>
    )
  }

  if (cliente) {
    return <TarjetaCliente cliente={cliente} onVolver={handleVolverBusqueda} />
  }

  if (mostrarFormularioRegistro) {
    return (
      <div className="min-h-screen text-light flex items-center justify-center p-6" style={estiloFondo}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logoSrc} alt={NOMBRE_NEGOCIO} className="h-20 mx-auto mb-4 object-contain" />
            <p className="text-gray-400">{SLOGAN}</p>
            <p className="text-gray-400">Completa tu registro</p>
            <p className="text-sm text-zinc-500 mt-2">Teléfono: {telefono}</p>
          </div>

          <form onSubmit={registrarCliente} className="bg-primary/90 border border-secondary rounded-lg p-8 shadow-primary">
            <div className="mb-6">
              <label htmlFor="nombre" className="block text-sm font-medium mb-2">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 bg-primary border border-secondary/60 rounded focus:border-secondary focus:outline-none text-light"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="referidoPor" className="block text-sm font-medium mb-2">
                ¿Quién te recomendó? (opcional)
              </label>
              <input
                id="referidoPor"
                type="tel"
                inputMode="tel"
                value={referidoPor}
                onChange={(e) => setReferidoPor(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-primary border border-secondary/60 rounded focus:border-secondary focus:outline-none text-light"
                placeholder="Teléfono de quien te recomendó"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Si un cliente te recomendó, ambos ganan un punto extra en tu primera visita
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/80 text-light font-bold py-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? 'Registrando...' : 'Registrarme'}
            </button>

            <button
              type="button"
              onClick={handleVolverDesdeRegistro}
              disabled={loading}
              className="w-full py-2 text-gray-300 hover:underline text-sm disabled:opacity-50"
            >
              ← Volver a buscar con otro teléfono
            </button>
          </form>

          <div className="flex justify-center gap-6 mt-6 text-sm">
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
              WhatsApp
            </a>
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
              Instagram
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-light flex items-center justify-center p-6" style={estiloFondo}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoSrc} alt={NOMBRE_NEGOCIO} className="h-20 mx-auto mb-4 object-contain" />
          <p className="text-gray-400">{SLOGAN}</p>
          <p className="text-gray-400 mt-2">Ingresa tu teléfono para ver tu tarjeta de lealtad</p>
        </div>

        <form onSubmit={buscarCliente} className="bg-primary/90 border border-secondary rounded-lg p-8 shadow-primary">
          <div className="mb-6">
            <label htmlFor="telefono" className="block text-sm font-medium mb-2">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-primary border border-secondary/60 rounded focus:border-secondary focus:outline-none text-light"
              placeholder="Ej: 6621234567"
              minLength={9}
              maxLength={15}
              required
            />
            <p className="text-xs text-zinc-500 mt-2">9 a 15 dígitos</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary/80 text-light font-bold py-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Continuar'}
          </button>
        </form>

        <div className="flex justify-center gap-6 mt-6 text-sm">
          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
            WhatsApp
          </a>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
            Instagram
          </a>
        </div>
      </div>
    </div>
  )
}
