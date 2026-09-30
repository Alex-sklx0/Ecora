import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

export default function PagoCancelado() {
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
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}
          >
            ✕
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            Pago cancelado
          </h2>

          <p style={{ color: '#4B5563', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            El proceso de pago fue cancelado o no se pudo completar. No se ha realizado ningún cobro a tu tarjeta.
          </p>

          <Link
            to="/catalogo"
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
            Volver al catálogo
          </Link>
        </div>
      </main>
    </div>
  )
}
