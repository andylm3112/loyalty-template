import { useEffect, useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import {
  COLOR_PRIMARIO,
  COLOR_SECUNDARIO,
  COLOR_FONDO,
  LOGO_URL,
  BANNER_URL,
  INSTAGRAM,
  NOMBRE_NEGOCIO,
  PUNTOS_META,
  SLOGAN,
  WHATSAPP,
} from '../config'
import type { Cliente, CuponCliente } from '../types'

interface Props {
  cliente: Cliente
  onVolver: () => void
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Fallbacks por si el prototipo no subió logo/banner al generarse
const LOGO_DEFAULT = '/no_bg_image.png'
const ESTRELLA_DEFAULT = '/no_bg_image (1).png'

export default function TarjetaCliente({ cliente: clienteInicial, onVolver }: Props) {
  const [cliente, setCliente] = useState(clienteInicial)
  const [cupones, setCupones] = useState<CuponCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [mensajeExpiracion, setMensajeExpiracion] = useState<string | null>(null)

  const logoSrc = LOGO_URL && !LOGO_URL.startsWith('{{') ? LOGO_URL : LOGO_DEFAULT
  const bannerSrc = BANNER_URL && !BANNER_URL.startsWith('{{') ? BANNER_URL : null
  const colorFondo = COLOR_FONDO && !COLOR_FONDO.startsWith('{{') ? COLOR_FONDO : null

  useEffect(() => {
    verificarYCargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, [])

  const verificarYCargarDatos = async () => {
    try {
      await verificarExpiracionPuntos()
      await cargarCupones()

      if (cliente.puntos === PUNTOS_META) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: [COLOR_SECUNDARIO, COLOR_PRIMARIO, '#f0f0f0'],
          })
        }, 500)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const verificarExpiracionPuntos = async () => {
    if (!cliente.ultima_visita || cliente.puntos === 0) {
      return
    }

    const hoy = new Date()
    const ultimaVisita = new Date(cliente.ultima_visita)
    const diasTranscurridos = Math.floor(
      (hoy.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diasTranscurridos > 30) {
      const { data } = await supabase
        .from('clientes')
        .update({ puntos: 0 })
        .eq('id', cliente.id)
        .select()
        .single()

      if (data) {
        setCliente(data as Cliente)
        setMensajeExpiracion('Tus puntos expiraron por inactividad. ¡Empieza de nuevo!')
      }
    }
  }

  const cargarCupones = async () => {
    const { data } = await supabase
      .from('cupones_clientes')
      .select('*, cupones(*)')
      .eq('cliente_id', cliente.id)
      .eq('canjeado', false)

    if (data) {
      const hoy = new Date()
      const cuponesActivos = data.filter((cupon) => {
        const expiracion = new Date(cupon.fecha_expiracion)
        return expiracion > hoy
      })
      setCupones(cuponesActivos as CuponCliente[])
    }
  }

  const calcularDiasRestantes = (fechaExpiracion: string) => {
    const hoy = new Date()
    const expiracion = new Date(fechaExpiracion)
    const dias = Math.ceil((expiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return dias > 0 ? dias : 0
  }

  const puntos = cliente.puntos || 0
  const qrUrl = `${import.meta.env.VITE_APP_DOMAIN || '{{VITE_APP_DOMAIN}}'}/scan/${cliente.id}`

  const estrellasStyles = useMemo(() => {
    return Array.from({ length: puntos }, (_, i) => {
      const seed = cliente.id.charCodeAt(0) + i * 31
      const rotation = -15 + pseudoRandom(seed) * 30
      const scale = 0.9 + pseudoRandom(seed + 7) * 0.2
      return { rotation, scale }
    })
  }, [puntos, cliente.id])

  const circulosRestantes = Math.max(PUNTOS_META - puntos, 0)

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

  if (loading) {
    return (
      <div className="min-h-screen text-light flex items-center justify-center" style={estiloFondo}>
        <div className="animate-spin h-12 w-12 border-4 border-secondary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-light p-6" style={estiloFondo}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <img src={logoSrc} alt={NOMBRE_NEGOCIO} className="h-24 mx-auto object-contain" />
          <p className="text-gray-400 mt-2">{SLOGAN}</p>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-gradient-to-br from-primary/95 to-primary border-2 border-secondary rounded-2xl p-8 shadow-primary-lg mb-6">
          {/* Nombre y teléfono */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">{cliente.nombre}</h2>
            <p className="text-gray-400">Tel: {cliente.telefono}</p>
          </div>

          {/* Mensaje de expiración */}
          {mensajeExpiracion && (
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500 rounded text-yellow-200 text-sm text-center">
              {mensajeExpiracion}
            </div>
          )}

                        {/* Progreso */}
          <div className="mb-8">
            <p className="text-center text-2xl font-bold mb-4" style={{ color: COLOR_SECUNDARIO }}>
              {cliente.puntos} / {PUNTOS_META} visitas
            </p>

            <div className="flex gap-2 flex-wrap justify-center items-center">
              {Array.from({ length: PUNTOS_META }, (_, i) => (
                <div
                  key={`circulo-${i}`}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    i < puntos ? 'bg-secondary border-secondary' : 'bg-transparent border-secondary/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="mb-4">
            <div className="bg-white p-6 rounded-xl mx-auto w-fit">
              <QRCodeCanvas value={qrUrl} size={200} level="H" includeMargin={false} />
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">Muestra este código en tu próxima visita</p>
          </div>
        </div>

        {/* Cupones activos */}
        {cupones.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-light mb-3">🎁 Cupones Disponibles</h3>
            {cupones.map((cupon) => (
              <div key={cupon.id} className="bg-primary/90 border border-secondary rounded-lg p-4 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg">{cupon.cupones.nombre}</h4>
                  <span className="text-xs bg-secondary text-light px-3 py-1 rounded font-bold">
                    {cupon.cupones.tipo === '2x1' ? '2x1' : 'GRATIS'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{cupon.cupones.descripcion}</p>
                <p className="text-xs text-yellow-400">
                  ⏰ Expira en {calcularDiasRestantes(cupon.fecha_expiracion)} días
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-6 mb-6 text-sm">
          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
            WhatsApp
          </a>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="text-secondary hover:underline">
            Instagram
          </a>
        </div>

        {/* Botón volver */}
        <button
          onClick={onVolver}
          className="w-full bg-secondary hover:bg-secondary/80 text-light font-bold py-3 rounded-lg transition"
        >
          ← Nueva búsqueda
        </button>
      </div>
    </div>
  )
}
