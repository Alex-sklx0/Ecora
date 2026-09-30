import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <Navbar />

      <main style={{ maxWidth: '500px', margin: '80px auto', padding: '0 24px' }}>
        {/* Wireframe 22-404 */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              border: '2px solid #22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 20px auto',
              color: '#22C55E',
            }}
          >
            📦❓
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#22C55E', marginBottom: '8px' }}>
            404
          </h1>

          <p style={{ fontSize: '16px', color: '#374151', marginBottom: '24px' }}>
            No se ha encontrado la página que buscas.
          </p>

          <Link
            to="/catalogo"
            style={{
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Ir al catálogo
          </Link>
        </div>
      </main>
    </div>
  )
}
