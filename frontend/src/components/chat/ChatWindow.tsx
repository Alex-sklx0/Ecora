import { useEffect, useRef, useState, FormEvent } from 'react'
import { useChat } from '../../hooks/useChat'
import MessageBubble from './MessageBubble'
import type { Subproducto, SolicitudIntercambioPayload } from '../../types'

interface Props {
  conversacionId: number
  contraparteNombre: string
  subproducto?: Subproducto | null
  onBack: () => void
  onAceptarSolicitud?: (solicitud: SolicitudIntercambioPayload) => void
  /** Nodo extra opcional */
  children?: React.ReactNode
}

export default function ChatWindow({
  conversacionId,
  contraparteNombre,
  subproducto,
  onBack,
  onAceptarSolicitud,
  children,
}: Props) {
  const { mensajes, loading, error, enviando, enviar } = useChat(conversacionId)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Determinar si el usuario es empresa (puede enviar solicitudes de intercambio)
  const esEmpresa = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      return Boolean(u.id_empresa)
    } catch {
      return false
    }
  })()

  // Estado del recuadro de solicitud de intercambio (Wireframe 13)
  const [showSolicitudBox, setShowSolicitudBox] = useState(false)
  const [solicitudCantidad, setSolicitudCantidad] = useState('1')
  const [solicitudPrecio, setSolicitudPrecio] = useState(
    subproducto ? String(subproducto.precio_inicial || '') : ''
  )
  const [solicitudError, setSolicitudError] = useState('')

  // Sincronizar precio inicial si llega el subproducto
  useEffect(() => {
    if (subproducto && !solicitudPrecio) {
      setSolicitudPrecio(String(subproducto.precio_inicial || ''))
    }
  }, [subproducto, solicitudPrecio])

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, showSolicitudBox])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const texto = input
    setInput('')
    await enviar(texto)
  }

  // Cuando la contraparte pide "Otra oferta" (contraoferta)
  const handlePedirOtraOferta = (sol: SolicitudIntercambioPayload) => {
    const maxDispon = subproducto?.volumen_disponible ? Number(subproducto.volumen_disponible) : null
    const initialCant = maxDispon !== null && sol.cantidad > maxDispon ? maxDispon : sol.cantidad
    setSolicitudCantidad(String(initialCant))
    setSolicitudPrecio(String(sol.precio))
    setShowSolicitudBox(true)
    setSolicitudError('')
  }

  // Enviar la propuesta de intercambio al chat
  const handleEnviarSolicitud = async (e: FormEvent) => {
    e.preventDefault()
    const cant = Number(solicitudCantidad)
    const prec = Number(solicitudPrecio)

    if (!Number.isFinite(cant) || cant <= 0) {
      setSolicitudError('Ingresa una cantidad válida mayor a 0.')
      return
    }

    const maxDispon = subproducto?.volumen_disponible ? Number(subproducto.volumen_disponible) : null
    if (maxDispon !== null && cant > maxDispon) {
      setSolicitudError(`La cantidad no puede superar la disponible (${maxDispon} ${subproducto?.unidad_medida_abreviatura || 'kg'}).`)
      return
    }

    if (!Number.isFinite(prec) || prec < 4000) {
      setSolicitudError('El precio total debe ser al menos 4.000 COP para procesar pagos con Stripe.')
      return
    }

    setSolicitudError('')

    const payload: SolicitudIntercambioPayload = {
      tipo: 'solicitud_intercambio',
      id_subproducto: subproducto?.id,
      material: subproducto?.nombre || 'Material',
      cantidad: cant,
      unidad: subproducto?.unidad_medida_abreviatura || 'kg',
      precio: prec,
    }

    await enviar(JSON.stringify(payload))
    setShowSolicitudBox(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 140px)',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#F9FAFB',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#374151',
            padding: '0 4px',
          }}
        >
          ←
        </button>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#065F46',
            fontSize: '14px',
          }}
        >
          {contraparteNombre.charAt(0).toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
            {contraparteNombre}
          </span>
          {subproducto && (
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              Interesado en: {subproducto.nombre}
            </span>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>Cargando mensajes...</p>
        )}
        {error && (
          <p style={{ textAlign: 'center', color: '#DC2626', fontSize: '13px' }}>{error}</p>
        )}
        {mensajes.map((m) => (
          <MessageBubble
            key={m.id}
            mensaje={m}
            onAceptarSolicitud={onAceptarSolicitud}
            onPedirOtraOferta={handlePedirOtraOferta}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Slot extra si se requiere */}
      {children && (
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '12px 20px' }}>{children}</div>
      )}

      {/* RECUADRO DESPLEGABLE: Formulario de Solicitud de Intercambio (Wireframe 13) */}
      {showSolicitudBox && (
        <div
          style={{
            borderTop: '1px solid #BAE6FD',
            backgroundColor: '#F0F9FF',
            padding: '16px 20px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🤝</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#0369A1' }}>
                Nueva solicitud de intercambio
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSolicitudBox(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                color: '#64748B',
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleEnviarSolicitud}>
            <div
              style={{
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              {/* Campo Cantidad */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Cantidad ({subproducto?.unidad_medida_abreviatura || 'kg'})
                  {subproducto?.volumen_disponible ? ` (Máx: ${subproducto.volumen_disponible})` : ''}:
                </label>
                <input
                  type="number"
                  min="0.1"
                  max={subproducto?.volumen_disponible ? Number(subproducto.volumen_disponible) : undefined}
                  step="any"
                  required
                  value={solicitudCantidad}
                  onChange={(e) => {
                    const val = e.target.value
                    const num = Number(val)
                    const maxDispon = subproducto?.volumen_disponible ? Number(subproducto.volumen_disponible) : null

                    if (maxDispon !== null && num > maxDispon) {
                      setSolicitudCantidad(String(maxDispon))
                      if (subproducto?.precio_inicial) {
                        setSolicitudPrecio(String(Math.round(maxDispon * Number(subproducto.precio_inicial))))
                      }
                      setSolicitudError(`La cantidad máxima disponible es ${maxDispon} ${subproducto?.unidad_medida_abreviatura || 'kg'}.`)
                      return
                    }

                    setSolicitudCantidad(val)
                    setSolicitudError('')
                    // Si tenemos subproducto, recalcular precio sugerido
                    if (subproducto && subproducto.precio_inicial) {
                      if (num > 0) {
                        setSolicitudPrecio(String(Math.round(num * Number(subproducto.precio_inicial))))
                      }
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    width: '140px',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Campo Precio */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Precio total ($ COP):
                </label>
                <input
                  type="number"
                  min="4000"
                  step="any"
                  required
                  value={solicitudPrecio}
                  onChange={(e) => setSolicitudPrecio(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    width: '150px',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Botón de Enviar Solicitud */}
              <button
                type="submit"
                disabled={enviando}
                style={{
                  backgroundColor: '#0F6E56',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  opacity: enviando ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Enviar propuesta</span>
              </button>
            </div>

            {solicitudError && (
              <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '8px', fontWeight: 500 }}>
                {solicitudError}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Input de Mensaje + Botón Solicitud de intercambio (Wireframe 13) */}
      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: '1px solid #E5E7EB',
          padding: '12px 16px',
          display: 'flex',
          gap: '10px',
          backgroundColor: '#F9FAFB',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={enviando}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontSize: '14px',
            outline: 'none',
          }}
        />

        {/* Botón "Solicitud de intercambio" como en Wireframe 13 — solo para empresas */}
        {esEmpresa && (
          <button
            type="button"
            onClick={() => {
              setShowSolicitudBox(!showSolicitudBox)
              setSolicitudError('')
            }}
            style={{
              backgroundColor: showSolicitudBox ? '#0b5240' : '#0F6E56',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s',
            }}
          >
            Solicitud de intercambio
          </button>
        )}

        {/* Botón "Enviar" */}
        <button
          type="submit"
          disabled={enviando || !input.trim()}
          style={{
            backgroundColor: '#22C55E',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: enviando || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: enviando || !input.trim() ? 0.6 : 1,
          }}
        >
          {enviando ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
