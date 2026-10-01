import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ChatList from '../components/chat/ChatList'
import ChatWindow from '../components/chat/ChatWindow'
import { chatApi, type Conversacion } from '../services/chatApi'
import { api } from '../services/api'
import { Subproducto, SolicitudIntercambioPayload } from '../types'

/**
 * Página /chat  → lista de conversaciones
 * Página /chat/:conversacionId → ventana de chat real
 * Soporta query param ?subproducto=:id para asociar material a la negociación
 */
export default function Chat() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const subproductoParam = searchParams.get('subproducto')

  const [conversacion, setConversacion] = useState<Conversacion | null>(null)
  const [loading, setLoading] = useState(Boolean(id || subproductoParam))
  const [error, setError] = useState('')

  // Estado para el flujo de pago con Stripe
  const [subproducto, setSubproducto] = useState<Subproducto | null>(null)
  const [step, setStep] = useState<'chat' | 'agreed' | 'logistics' | 'address'>('chat')
  const [cantidadInput, setCantidadInput] = useState('1')
  const [direccionInput, setDireccionInput] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [stripeError, setStripeError] = useState('')

  useEffect(() => {
    async function init() {
      // 1. Cargar subproducto si viene en la query string
      if (subproductoParam) {
        try {
          const sRes = await api.get<{ ok: boolean; subproducto: Subproducto }>(
            `/subproductos/${subproductoParam}`
          )
          if (sRes.ok && sRes.subproducto) {
            setSubproducto(sRes.subproducto)
          }
        } catch (e) {
          console.error('Error cargando subproducto:', e)
        }
      }

      if (!id && !subproductoParam) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        // Caso A: Entramos desde catálogo con ?subproducto=X pero sin :id de conversación
        if (!id && subproductoParam) {
          const sRes = await api.get<{ ok: boolean; subproducto: Subproducto }>(
            `/subproductos/${subproductoParam}`
          )
          if (!sRes.ok || !sRes.subproducto) {
            setError('Subproducto no encontrado.')
            return
          }
          const sub = sRes.subproducto
          setSubproducto(sub)

          let ownerId = sub.empresa_usuario_id
          if (!ownerId) {
            const empRes = await api.get<{ ok: boolean; empresa: { id_usuario: string } }>(
              `/empresas/${sub.id_empresa}`
            )
            ownerId = empRes.empresa?.id_usuario
          }

          if (!ownerId) {
            setError('No se pudo identificar a la empresa dueña de este material.')
            return
          }

          const convCr = await chatApi.crearConversacion(ownerId)
          setConversacion(convCr.conversacion)
          navigate(`/chat/${convCr.conversacion.id}?subproducto=${sub.id}`, { replace: true })
          return
        }

        // Caso B: Tenemos un :id en la URL
        if (id) {
          // Intentar primero como ID de conversación
          const convRes = await chatApi.getMensajes(Number(id), { limit: 10 }).catch(() => null)

          if (convRes) {
            const convList = await chatApi.getConversaciones()
            const found = convList.conversaciones.find((c) => c.id === Number(id))
            if (found) {
              setConversacion(found)

              // Si aún no tenemos subproducto, buscar en los mensajes de la conversación
              if (!subproducto && !subproductoParam && convRes.mensajes?.length > 0) {
                const solMsg = convRes.mensajes.find((m) =>
                  m.contenido.includes('solicitud_intercambio')
                )
                if (solMsg) {
                  try {
                    const parsed = JSON.parse(solMsg.contenido)
                    if (parsed.id_subproducto) {
                      const resSub = await api.get<{ ok: boolean; subproducto: Subproducto }>(
                        `/subproductos/${parsed.id_subproducto}`
                      )
                      if (resSub.ok && resSub.subproducto) setSubproducto(resSub.subproducto)
                    }
                  } catch {}
                }
              }
              return
            }
          }

          // Si no fue id de conversación, tratarlo como ID de subproducto
          const subRes = await api.get<{ ok: boolean; subproducto: Subproducto }>(
            `/subproductos/${id}`
          )
          if (subRes.ok && subRes.subproducto) {
            const sub = subRes.subproducto
            setSubproducto(sub)

            let ownerId = sub.empresa_usuario_id
            if (!ownerId) {
              const empRes = await api.get<{ ok: boolean; empresa: { id_usuario: string } }>(
                `/empresas/${sub.id_empresa}`
              )
              ownerId = empRes.empresa?.id_usuario
            }

            if (ownerId) {
              const convCr = await chatApi.crearConversacion(ownerId)
              setConversacion(convCr.conversacion)
              navigate(`/chat/${convCr.conversacion.id}?subproducto=${sub.id}`, { replace: true })
              return
            }
          }
        }
      } catch (e: any) {
        setError(e.message ?? 'Error al abrir el chat')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [id, subproductoParam, navigate])

  // ── Checkout Stripe ──────────────────────────────────────────────────────
  const executeCheckout = async (direccion?: string) => {
    setCheckoutLoading(true)
    setStripeError('')
    try {
      let currentSub = subproducto
      // 1. Fallback: Si no está en estado, buscarlo por query param
      const subIdQuery = searchParams.get('subproducto')
      if (!currentSub && subIdQuery) {
        try {
          const res = await api.get<{ ok: boolean; subproducto: Subproducto }>(
            `/subproductos/${subIdQuery}`
          )
          if (res.ok && res.subproducto) {
            currentSub = res.subproducto
            setSubproducto(res.subproducto)
          }
        } catch {}
      }

      // 2. Fallback: Buscar en catálogo activo
      if (!currentSub) {
        try {
          const catRes = await api.get<{ ok: boolean; subproductos: Subproducto[] }>('/catalogo')
          if (catRes.ok && catRes.subproductos && catRes.subproductos.length > 0) {
            const first = catRes.subproductos[0]
            const detRes = await api.get<{ ok: boolean; subproducto: Subproducto }>(`/subproductos/${first.id}`)
            if (detRes.ok && detRes.subproducto) {
              currentSub = detRes.subproducto
              setSubproducto(detRes.subproducto)
            }
          }
        } catch {}
      }

      if (!currentSub) {
        setStripeError('No se encontró el subproducto asociado a la compra. Por favor vuelve al catálogo y selecciona el subproducto.')
        return
      }

      const stock = Number(currentSub.volumen_disponible ?? 0)
      const sinStock = !currentSub.disponible || stock <= 0
      if (sinStock) {
        setStripeError('Este material ya no cuenta con stock disponible para la venta.')
        return
      }

      const cantidad = Number(cantidadInput) || 1
      if (!Number.isFinite(cantidad) || cantidad <= 0 || (stock > 0 && cantidad > stock)) {
        setStripeError(`Cantidad inválida o supera el stock disponible (${stock}).`)
        return
      }

      const precioUnitario = Number(currentSub.precio_inicial || 0)
      const total = precioUnitario * cantidad
      if (!Number.isFinite(total) || total < 4000) {
        setStripeError('El monto total debe ser al menos 4.000 COP para procesar el pago con Stripe.')
        return
      }

      const res = await api.post<{ ok: boolean; url: string }>('/stripe/checkout', {
        id_subproducto: currentSub.id,
        cantidad,
        ...(direccion?.trim() ? { direccion_entrega: direccion.trim() } : {}),
      })

      if (res.ok && res.url) {
        window.location.href = res.url
        return
      }
      setStripeError('No se pudo generar la sesión de pago de Stripe.')
    } catch (e: any) {
      setStripeError(e.message || 'Error al conectar con Stripe Checkout.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleAceptarSolicitud = async (sol: SolicitudIntercambioPayload) => {
    setCantidadInput(String(sol.cantidad))
    let foundSub: Subproducto | null = null

    if (sol.id_subproducto) {
      try {
        const res = await api.get<{ ok: boolean; subproducto: Subproducto }>(
          `/subproductos/${sol.id_subproducto}`
        )
        if (res.ok && res.subproducto) {
          foundSub = res.subproducto
          setSubproducto(res.subproducto)
        }
      } catch (err) {
        console.error('Error cargando subproducto de la solicitud:', err)
      }
    }

    if (!foundSub && searchParams.get('subproducto')) {
      try {
        const res = await api.get<{ ok: boolean; subproducto: Subproducto }>(
          `/subproductos/${searchParams.get('subproducto')}`
        )
        if (res.ok && res.subproducto) {
          foundSub = res.subproducto
          setSubproducto(res.subproducto)
        }
      } catch {}
    }

    if (!foundSub) {
      try {
        const catRes = await api.get<{ ok: boolean; subproductos: Subproducto[] }>('/catalogo')
        if (catRes.ok && catRes.subproductos && catRes.subproductos.length > 0) {
          const match = (sol.material && catRes.subproductos.find((s) => s.nombre.toLowerCase().includes(sol.material!.toLowerCase()))) || catRes.subproductos[0]
          const detRes = await api.get<{ ok: boolean; subproducto: Subproducto }>(`/subproductos/${match.id}`)
          if (detRes.ok && detRes.subproducto) {
            setSubproducto(detRes.subproducto)
          }
        }
      } catch {}
    }

    setStep('agreed')
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF' }}>Abriendo chat...</div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#DC2626' }}>{error}</div>
    )
  }

  const unidad = subproducto?.unidad_medida_abreviatura || 'kg'

  return (
    <>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '12px 0' }}>
        {!conversacion ? (
          /* Listado de conversaciones */
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '20px' }}>
              Mis chats
            </h2>
            <ChatList />
          </>
        ) : (
          /* Ventana de conversación */
          <ChatWindow
            conversacionId={conversacion.id}
            contraparteNombre={conversacion.contraparte?.nombre ?? 'Usuario'}
            subproducto={subproducto}
            onAceptarSolicitud={handleAceptarSolicitud}
            onBack={() => navigate('/chat')}
          />
        )}
      </div>

      {/* MODAL 14: Acordado */}
      {step === 'agreed' && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={{ fontSize: '48px', color: '#22C55E', marginBottom: '8px' }}>✓</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Intercambio acordado</h3>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '10px 0 20px' }}>
              {subproducto?.nombre || 'Material'} · {cantidadInput} {unidad}
            </p>
            <button onClick={() => setStep('logistics')} style={styles.btnPrimary}>
              Acordar transporte
            </button>
          </div>
        </div>
      )}

      {/* MODAL 15: Logística */}
      {step === 'logistics' && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Acuerdo de logística
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              ¿Quién gestiona el transporte?
            </p>
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '8px' }}>
              {(['self', 'ecora'] as const).map((opt) => (
                <div
                  key={opt}
                  onClick={() => !checkoutLoading && (opt === 'self' ? executeCheckout() : setStep('address'))}
                  style={{ ...styles.optionCard, opacity: checkoutLoading ? 0.6 : 1 }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '6px' }}>{opt === 'self' ? '👤' : '🚚'}</div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{opt === 'self' ? 'Yo mismo' : 'Ecora se encarga'}</div>
                </div>
              ))}
            </div>
            {checkoutLoading && <p style={{ color: '#166534', fontWeight: 600, marginTop: '12px' }}>Conectando con Stripe...</p>}
            {stripeError && <p style={styles.errMsg}>{stripeError}</p>}
          </div>
        </div>
      )}

      {/* MODAL 16: Dirección */}
      {step === 'address' && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              ¿A dónde enviamos?
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
              Danos tu dirección exacta de entrega.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); executeCheckout(direccionInput) }}>
              <input
                type="text"
                required
                placeholder="Dirección exacta, municipio, indicaciones..."
                value={direccionInput}
                onChange={(e) => setDireccionInput(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <button type="submit" disabled={checkoutLoading} style={styles.btnPrimary}>
                {checkoutLoading ? 'Conectando con Stripe...' : 'Continuar al pago'}
              </button>
              {stripeError && <p style={styles.errMsg}>{stripeError}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', top: 72, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  },
  modal: {
    backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '36px',
    maxWidth: '480px', width: '90%', textAlign: 'center',
    boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
  },
  btnPrimary: {
    backgroundColor: '#22C55E', color: '#FFF', border: 'none',
    padding: '12px 28px', borderRadius: '8px', fontWeight: 700,
    fontSize: '15px', cursor: 'pointer',
  },
  optionCard: {
    width: '110px', padding: '14px 10px', borderRadius: '14px',
    cursor: 'pointer', backgroundColor: '#F4F7FB',
    boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
  },
  errMsg: {
    marginTop: '12px', backgroundColor: '#FEE2E2', color: '#DC2626',
    padding: '10px', borderRadius: '8px', fontSize: '13px',
  },
}
