import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

export default function PagoExito() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <Navbar />

      <main style={{ maxWidth: '540px', margin: '60px auto', padding: '0 24px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
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
            Tu pago ha sido procesado mediante Stripe Checkout. La orden de intercambio ha sido registrada y el subproducto reservado.
          </p>

          {sessionId && (
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '24px', wordBreak: 'break-all' }}>
              ID de Sesión: {sessionId}
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
