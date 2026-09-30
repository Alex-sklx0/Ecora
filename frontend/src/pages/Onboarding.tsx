import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const slides = [
  {
    title: 'Conecta tus subproductos a través de Ecora',
    description:
      'Ponte de acuerdo con otros para gestionar mejor el transporte de tus subproductos...',
    image: '/circle-box.png',
  },
  {
    title: 'Mejoremos juntos la eficiencia del transporte',
    description:
      'Coordina entregas y reduce viajes vacíos entre empresas del Valle de Aburrá...',
    image: '/shipper.png',
  },
  {
    title: 'Certificate y siéntete seguro con nosotros',
    description:
      'Genera certificados por tus ventas o compras concretadas y siéntete seguro de apoyar nuestra economía circular...',
    image: '/certificate.png',
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const slide = slides[current]

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
        backgroundColor: '#F3F6F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <button
        type="button"
        onClick={handleNext}
        style={{
          backgroundColor: '#FFFFFF',
          border: 'none',
          borderRadius: '18px',
          padding: '36px 40px',
          maxWidth: '760px',
          width: '100%',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          textAlign: 'left',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '28px',
            left: '28px',
            width: '28px',
            height: '22px',
            borderTop: '3px solid #22C55E',
            borderLeft: '3px solid #22C55E',
            borderTopLeftRadius: '8px',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingLeft: '16px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '28px 0 16px' }}>
              {slide.title}
            </h2>
            <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: 1.6, maxWidth: '340px' }}>
              {slide.description}
            </p>
          </div>
          <img src={slide.image} alt="" width={140} height={140} style={{ objectFit: 'contain' }} />
        </div>
      </button>
    </div>
  )
}
