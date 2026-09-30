import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { api } from '../services/api'
import { Subproducto } from '../types'

const fallback = [
  {
    name: 'Recimed',
    descripcion: 'Empresa aprovechadora de carton.',
    ubicacion: 'Medellín.',
    frecuencia: 'diaria.',
    pct: 94,
    id: undefined as number | undefined,
  },
  {
    name: 'Fibretex',
    descripcion: 'Generador de retazos textiles.',
    ubicacion: 'Itagüí.',
    frecuencia: 'semanal.',
    pct: 81,
    id: undefined as number | undefined,
  },
  {
    name: 'Natuh',
    descripcion: 'Transformador de envases PET.',
    ubicacion: 'Envigado.',
    frecuencia: 'mensual.',
    pct: 73,
    id: undefined as number | undefined,
  },
]

export default function Matching() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [cards, setCards] = useState(fallback)

  useEffect(() => {
    api
      .get<{ ok: boolean; subproductos: Subproducto[] }>('/catalogo?')
      .then((res) => {
        if (!res.ok || res.subproductos.length === 0) return
        setCards(
          res.subproductos.slice(0, 6).map((item, i) => ({
            name: item.empresa_nombre || item.nombre,
            descripcion: item.descripcion || item.nombre,
            ubicacion: `${item.municipio || 'Medellín'}.`,
            frecuencia: item.frecuencia || 'disponible.',
            pct: Math.max(70, 96 - i * 4),
            id: item.id,
          }))
        )
      })
      .catch(() => undefined)
  }, [])

  const card = cards[index]
  const prev = () => setIndex((value) => (value - 1 + cards.length) % cards.length)
  const next = () => setIndex((value) => (value + 1) % cards.length)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
      <Navbar />

      <main
        style={{
          maxWidth: '980px',
          margin: '0 auto',
          padding: '72px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
        }}
      >
        <button type="button" onClick={prev} style={arrowStyle} aria-label="Anterior">
          ←
        </button>

        <div style={{ position: 'relative', width: 'min(520px, 100%)' }}>
          <div style={{ ...sideCard, left: '-36px', backgroundColor: '#D7F3E4' }} />
          <div style={{ ...sideCard, right: '-36px', left: 'auto', backgroundColor: '#E7F0FA' }} />
          <article
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '40px 36px',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <img src="/user.png" alt="" width={36} height={36} />
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>{card.name}</h2>
            <div style={{ textAlign: 'left', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.8 }}>
              <div><strong>Descripción:</strong> {card.descripcion}</div>
              <div><strong>Ubicación:</strong> {card.ubicacion}</div>
              <div><strong>Frecuencia de compra:</strong> {card.frecuencia}</div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                Porcentaje de coincidencia con tus necesidades:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, backgroundColor: '#E5E7EB', height: '10px', borderRadius: '999px' }}>
                  <div style={{ width: `${card.pct}%`, backgroundColor: '#22C55E', height: '100%', borderRadius: '999px' }} />
                </div>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>{card.pct}%</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(card.id ? `/chat/${card.id}` : '/catalogo')}
              style={{
                backgroundColor: '#22C55E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 22px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Contactar
            </button>
          </article>
        </div>

        <button type="button" onClick={next} style={arrowStyle} aria-label="Siguiente">
          →
        </button>
      </main>
    </div>
  )
}

const arrowStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '36px',
  cursor: 'pointer',
  color: '#111827',
}

const sideCard: CSSProperties = {
  position: 'absolute',
  top: '28px',
  bottom: '28px',
  width: '72px',
  borderRadius: '16px',
  zIndex: 0,
}
