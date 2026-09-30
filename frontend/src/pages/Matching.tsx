import Navbar from '../components/layout/Navbar'
import { useNavigate } from 'react-router-dom'

export default function Matching() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <Navbar />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 16px auto',
            }}
          >
            👤
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
            Recimed
          </h2>

          <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '14px', lineHeight: 1.8 }}>
            <div><strong>Descripción:</strong> Empresa aprovechadora de cartón.</div>
            <div><strong>Ubicación:</strong> Medellín.</div>
            <div><strong>Frecuencia de compra:</strong> diaria.</div>
          </div>

          <div style={{ maxWidth: '400px', margin: '0 auto 32px auto' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              Porcentaje de coincidencia con tus necesidades:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, backgroundColor: '#E5E7EB', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: '94%', backgroundColor: '#22C55E', height: '100%' }} />
              </div>
              <span style={{ fontWeight: 700, color: '#22C55E' }}>94%</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/catalogo')}
            style={{
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 36px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Contactar
          </button>
        </div>
      </main>
    </div>
  )
}
