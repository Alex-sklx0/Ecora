import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
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
  const executeCheckout = async () => {
    if (!subproducto) return
    setCheckoutLoading(true)
    setError('')
    try {
      const res = await api.post<{ ok: boolean; url: string }>('/stripe/checkout', {
        id_subproducto: subproducto.id,
        precio_final: subproducto.precio_inicial || 327000,
      })

      if (res.ok && res.url) {
        // Redirigir a la pasarela hospedada de Stripe (Wireframe 17)
        window.location.href = res.url
      }
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
    if (subproducto && direccionInput) {
      try {
        await api.patch(`/subproductos/${subproducto.id}`, { direccion: direccionInput })
      } catch {
        // Ignorar si no es el dueño
      }
    }
    await executeCheckout()
  }

  if (loading || !subproducto) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Cargando chat...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <Navbar />

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
                  backgroundColor: m.sender === 'buyer' ? '#047857' : '#F3F4F6',
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
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Cantidad:</span>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>
                      {subproducto.volumen_disponible} kg
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Precio:</span>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>
                      ${subproducto.precio_inicial?.toLocaleString() || '327.000'} COP
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('agreed')}
                style={{
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Confirmar intercambio
              </button>
            </div>
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
                El acuerdo entre {subproducto.empresa_nombre || 'Fibretex'} y tu empresa quedó registrado.
              </p>

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

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div
                  onClick={() => handleLogisticsChoice('self')}
                  style={styles.optionCard}
                >
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>👤</div>
                  <div style={{ fontWeight: 700 }}>Yo mismo</div>
                </div>

                <div
                  onClick={() => handleLogisticsChoice('ecora')}
                  style={styles.optionCard}
                >
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🚚</div>
                  <div style={{ fontWeight: 700 }}>Ecora se encarga</div>
                </div>
              </div>
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
                  {checkoutLoading ? 'Ir a Stripe...' : 'Continuar al pago'}
                </button>
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '460px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  primaryModalBtn: {
    width: '100%',
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
  },
  optionCard: {
    flex: 1,
    padding: '24px 16px',
    border: '2px solid #E5E7EB',
    borderRadius: '12px',
    cursor: 'pointer',
    backgroundColor: '#F9FAFB',
    transition: 'all 0.2s ease',
  },
}
