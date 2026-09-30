import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
      <Navbar />

      <main style={{ maxWidth: '560px', margin: '100px auto', padding: '0 24px' }}>
        <Link
          to="/catalogo"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '36px 32px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <img src="/not-found.png" alt="" width={72} height={72} />
          <div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#22C55E', lineHeight: 1 }}>404</div>
            <p style={{ color: '#374151', marginTop: '6px', maxWidth: '220px' }}>
              No se ha encontrado la página que buscas.
            </p>
          </div>
        </Link>
      </main>
    </div>
  )
}
