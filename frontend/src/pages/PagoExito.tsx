import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { Intercambio } from '../types'

export default function PagoExito() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [intercambio, setIntercambio] = useState<Intercambio | null>(null)
  const [waiting, setWaiting] = useState(Boolean(sessionId))

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    let attempts = 0

    const poll = async () => {
      try {
        if (attempts === 0) {
          await api.post('/stripe/confirm', { session_id: sessionId })
        }
        const res = await api.get<{ ok: boolean; intercambios: Intercambio[] }>(
          '/intercambios?rol=comprador'
        )
        const found = res.intercambios?.find((item) => item.stripe_session_id === sessionId)
        if (found) {
          if (!cancelled) {
            setIntercambio(found)
            setWaiting(false)
          }
          return
        }
      } catch {
        // El webhook puede tardar unos segundos en registrar el intercambio.
      }

      attempts += 1
      if (!cancelled && attempts < 8) {
        window.setTimeout(poll, 1500)
      } else if (!cancelled) {
        setWaiting(false)
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
      <main style={{ maxWidth: '540px', margin: '60px auto', padding: '0 24px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#E7F6EC',
              color: '#15803D',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}
          >
            ✓
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            ¡Pago confirmado con éxito!
          </h2>

          <p style={{ color: '#4B5563', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            {waiting
              ? 'Estamos confirmando el pago con Stripe...'
              : 'Tu pago ha sido procesado mediante Stripe Checkout. La orden de intercambio ha sido registrada y el subproducto reservado.'}
          </p>

          {intercambio && (
            <div
              style={{
                backgroundColor: '#F3F6F4',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '14px',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>{intercambio.subproducto.nombre}</div>
              <div>Precio: ${intercambio.precio_final.toLocaleString('es-CO')} COP</div>
              <div>Estado: {intercambio.estado_pago}</div>
              <div>Vendedor: {intercambio.vendedor.nombre}</div>
            </div>
          )}

          <Link
            to="/perfil"
            style={{
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Ver mis intercambios
          </Link>
        </div>
      </main>
    </div>
  )
}
