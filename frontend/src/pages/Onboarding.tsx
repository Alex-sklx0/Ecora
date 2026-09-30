import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const slides = [
  {
    title: 'Conecta tus subproductos a través de Ecora',
    description:
      'Ponte de acuerdo con otros para gestionar mejor el transporte de tus subproductos...',
    icon: '📦',
  },
  {
    title: 'Mejoremos juntos la eficiencia del transporte',
    description:
      'Genera certificados por tus ventas o compras concretadas y siéntete seguro de apoyar nuestra economía circular...',
    icon: '🚚',
  },
  {
    title: 'Certificate y siéntete seguro con nosotros',
    description:
      'Genera certificados por tus ventas o compras concretadas y siéntete seguro de apoyar nuestra economía circular...',
    icon: '📜',
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1)
    } else {
      navigate('/pre-register')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#EAECEE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '72px', marginBottom: '24px' }}>{slides[current].icon}</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
          {slides[current].title}
        </h2>
        <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6, marginBottom: '32px' }}>
          {slides[current].description}
        </p>

        {/* Indicadores de slide */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: i === current ? '#22C55E' : '#D1D5DB',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/pre-register')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Saltar
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {current === slides.length - 1 ? 'Empezar' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
