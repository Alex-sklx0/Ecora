import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'
import { Subproducto } from '../types'

export default function Chat() {
  const { id } = useParams()
  const [subproducto, setSubproducto] = useState<Subproducto | null>(null)
  const [loading, setLoading] = useState(true)

  // Mensajes simulados
  const [messages, setMessages] = useState<Array<{ sender: 'buyer' | 'seller'; text: string }>>([
    { sender: 'buyer', text: 'Hola, estamos interesados en los recortes de algodón. ¿Siguen disponibles los 250 kg?' },
    { sender: 'seller', text: 'Hola. Sí, están disponibles. Podemos coordinar la entrega en Medellín.' },
    { sender: 'seller', text: 'Nuestra dirección es carrera 1 # 2-3, Medellín.' },
  ])
  const [inputMsg, setInputMsg] = useState('')

  // Modales de flujo (14, 15, 16)
  const [step, setStep] = useState<'chat' | 'agreed' | 'logistics' | 'address'>('chat')
  const [direccionInput, setDireccionInput] = useState('')
  const [cantidadInput, setCantidadInput] = useState('1')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await api.get<{ ok: boolean; subproducto: Subproducto }>(`/subproductos/${id}`)
        if (res.ok) setSubproducto(res.subproducto)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSub()
  }, [id])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim()) return
    setMessages([...messages, { sender: 'buyer', text: inputMsg }])
    setInputMsg('')
  }

  // Trigger para iniciar Stripe Checkout
  const stock = Number(subproducto?.volumen_disponible ?? 0)
  const sinStock = !subproducto?.disponible || stock <= 0
  const unidad = subproducto?.unidad_medida_abreviatura || 'kg'

  const cantidadSeleccionada = () => {
    const cantidad = Number(cantidadInput)
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > stock) return null
    return cantidad
  }

  const executeCheckout = async (direccion?: string) => {
    if (!subproducto) return
    setCheckoutLoading(true)
    setError('')
    try {
      if (sinStock) {
        setError('Este material está sin stock.')
        setCheckoutLoading(false)
        return
      }

      const cantidad = cantidadSeleccionada()
      if (!cantidad) {
        setError('La cantidad no puede superar el stock disponible.')
        setCheckoutLoading(false)
        return
      }

      const total = Number(subproducto.precio_inicial) * cantidad
      if (!Number.isFinite(total) || total <= 4000) {
        setError('El monto debe ser mayor a 4000 COP para pagar con Stripe.')
        setCheckoutLoading(false)
        return
      }

      const direccionEntrega = direccion?.trim()
      const res = await api.post<{ ok: boolean; url: string }>('/stripe/checkout', {
        id_subproducto: subproducto.id,
        cantidad,
        ...(direccionEntrega ? { direccion_entrega: direccionEntrega } : {}),
      })

      if (res.ok && res.url) {
        window.location.href = res.url
        return
      }
      setError('No se pudo abrir la pasarela de Stripe.')
      setCheckoutLoading(false)
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Stripe Checkout.')
      setCheckoutLoading(false)
    }
  }

  // Manejo de opción de logística
  const handleLogisticsChoice = async (option: 'self' | 'ecora') => {
    if (option === 'self') {
      await executeCheckout()
    } else {
      setStep('address')
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await executeCheckout(direccionInput)
  }

  if (loading || !subproducto) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Cargando chat...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        <Link
          to={`/catalogo/${id}`}
          style={{
            color: '#22C55E',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '16px',
            display: 'inline-block',
          }}
        >
          ← Volver atrás
        </Link>

        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
          Contacto con {subproducto.empresa_nombre || 'Fibretex'}
        </h2>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
          {subproducto.nombre} · Match 94%
        </p>

        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Ventana de Chat Wireframe 13 */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '240px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'buyer' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.sender === 'buyer' ? '#0F6E56' : '#F3F4F6',
                  color: m.sender === 'buyer' ? '#FFFFFF' : '#111827',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  maxWidth: '70%',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}
              >
                {m.text}
              </div>
            ))}

            {/* Tarjeta de solicitud de intercambio en el Chat (Wireframe 13) */}
            <div
              style={{
                backgroundColor: '#E0F2FE',
                borderRadius: '12px',
                padding: '16px 24px',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', color: '#0369A1', fontWeight: 600 }}>
                  {subproducto.empresa_nombre || 'Fibretex'} te ha enviado una solicitud de intercambio:
                </span>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <div style={styles.statBox}>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Cantidad:</div>
                    <input
                      type="number"
                      min="0"
                      max={stock}
                      step="any"
                      value={cantidadInput}
                      disabled={sinStock}
                      onChange={(e) => setCantidadInput(e.target.value)}
                      style={{
                        width: '88px',
                        marginTop: '4px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontWeight: 700,
                      }}
                    />
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      de {stock} {unidad}
                    </div>
                  </div>
                  <div style={styles.statBox}>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Precio:</div>
                    <div style={{ fontWeight: 700 }}>
                      {(Number(subproducto.precio_inicial || 0) * (cantidadSeleccionada() || 0)).toLocaleString('es-CO')} $
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>Total</div>
                  </div>
                </div>
              </div>

              <button
                disabled={sinStock}
                onClick={() => {
                  if (sinStock) {
                    setError('Este material está sin stock.')
                    return
                  }
                  if (!cantidadSeleccionada()) {
                    setError('La cantidad no puede superar el stock disponible.')
                    return
                  }
                  const total = Number(subproducto.precio_inicial) * Number(cantidadInput)
                  if (!Number.isFinite(total) || total <= 4000) {
                    setError('El monto debe ser mayor a 4000 COP para pagar con Stripe.')
                    return
                  }
                  setError('')
                  setStep('agreed')
                }}
                style={{
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: sinStock ? 'not-allowed' : 'pointer',
                  opacity: sinStock ? 0.6 : 1,
                }}
              >
                {sinStock ? 'Sin stock' : 'Confirmar intercambio'}
              </button>
            </div>
            {error && step === 'chat' && (
              <p style={{ color: '#B91C1C', fontSize: '13px', marginTop: '8px' }}>{error}</p>
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
              }}
            />
            <button
              type="button"
              onClick={() => setStep('agreed')}
              style={{
                backgroundColor: '#0F6E56',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Solicitud de intercambio
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#22C55E',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Enviar
            </button>
          </form>
        </div>

        {/* MODAL 14: Confirmación de Intercambio */}
        {step === 'agreed' && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={{ fontSize: '48px', color: '#22C55E', marginBottom: '12px' }}>✓</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                Intercambio acordado
              </h3>
              <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
                El acuerdo entre {subproducto.empresa_nombre || 'Fibretex'} y tu empresa quedó registrado
                como demostración del prototipo.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={styles.statBox}>
                  <div style={{ fontWeight: 700 }}>{cantidadInput} {unidad}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Material</div>
                </div>
                <div style={styles.statBox}>
                  <div style={{ fontWeight: 700 }}>94%</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Compatibilidad</div>
                </div>
              </div>

              <button
                onClick={() => setStep('logistics')}
                style={styles.primaryModalBtn}
              >
                Acordar transporte
              </button>
            </div>
          </div>
        )}

        {/* MODAL 15: Acuerdo de Logística */}
        {step === 'logistics' && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                Acuerdo de logística
              </h3>
              <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
                ¿Quién va a gestionar el transporte de tus subproductos?
              </p>

              <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', marginBottom: '8px' }}>
                <div
                  onClick={() => !checkoutLoading && handleLogisticsChoice('self')}
                  style={{ ...styles.optionCard, opacity: checkoutLoading ? 0.6 : 1 }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>👤</div>
                  <div style={{ fontWeight: 700 }}>Yo mismo</div>
                </div>

                <div
                  onClick={() => !checkoutLoading && handleLogisticsChoice('ecora')}
                  style={{ ...styles.optionCard, opacity: checkoutLoading ? 0.6 : 1 }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🚚</div>
                  <div style={{ fontWeight: 700 }}>Ecora se encarga</div>
                </div>
              </div>
              {checkoutLoading && (
                <p style={{ marginTop: '16px', color: '#166534', fontWeight: 600 }}>Ir a Stripe...</p>
              )}
              {error && <p style={styles.panelError}>{error}</p>}
            </div>
          </div>
        )}

        {/* MODAL 16: Dirección Ecora */}
        {step === 'address' && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                No te preocupes, nosotros te lo enviamos
              </h3>
              <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
                Pero antes, danos tu dirección exacta.
              </p>

              <form onSubmit={handleAddressSubmit}>
                <input
                  type="text"
                  required
                  placeholder="Dirección exacta, condiciones de entrega..."
                  value={direccionInput}
                  onChange={(e) => setDireccionInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    marginBottom: '20px',
                    boxSizing: 'border-box',
                  }}
                />

                <button
                  type="submit"
                  disabled={checkoutLoading}
                  style={styles.primaryModalBtn}
                >
                  {checkoutLoading ? 'Ir a Stripe...' : 'Continuar'}
                </button>
                {error && <p style={styles.panelError}>{error}</p>}
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: 'fixed',
    top: 72,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F3F6F4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '520px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
  },
  primaryModalBtn: {
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
  },
  optionCard: {
    width: '120px',
    padding: '16px 12px',
    borderRadius: '16px',
    cursor: 'pointer',
    backgroundColor: '#F4F7FB',
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.06)',
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '10px 16px',
    minWidth: '110px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  },
  panelError: {
    marginTop: '16px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
  },
}
