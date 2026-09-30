import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Subproducto } from '../types'

export default function CatalogoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { empresa } = useAuth()

  const [subproducto, setSubproducto] = useState<Subproducto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get<{ ok: boolean; subproducto: Subproducto }>(`/subproductos/${id}`)
        if (res.ok) {
          setSubproducto(res.subproducto)
        }
      } catch (err: any) {
        setError(err.message || 'No se encontró el subproducto.')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Cargando...</div>
      </div>
    )
  }

  if (error || !subproducto) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px', color: '#DC2626' }}>
          {error || 'El subproducto no existe.'}
        </div>
      </div>
    )
  }

  const isOwner = empresa && Number(empresa.id) === Number(subproducto.id_empresa)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <Navbar />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        <Link
          to="/catalogo"
          style={{
            color: '#22C55E',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '14px',
            display: 'inline-block',
            marginBottom: '20px',
          }}
        >
          ← Volver al catálogo
        </Link>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Foto del subproducto */}
          <div
            style={{
              flex: '1 1 400px',
              backgroundColor: '#D1FAE5',
              borderRadius: '16px',
              height: '340px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {subproducto.foto_url ? (
              <img
                src={subproducto.foto_url}
                alt={subproducto.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '96px' }}>🧵</span>
            )}
          </div>

          {/* Tarjeta de información (Wireframes 11 y 12) */}
          <div
            style={{
              flex: '1 1 360px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                alignSelf: 'flex-start',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                fontSize: '13px',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '12px',
                marginBottom: '12px',
              }}
            >
              {subproducto.familia_material || 'Textil'}
            </span>

            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              {subproducto.nombre}
            </h1>

            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              Publicación de {subproducto.empresa_nombre || 'Fibretex'}
            </p>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div
                style={{
                  backgroundColor: '#F3F4F6',
                  padding: '12px 20px',
                  borderRadius: '10px',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                  {subproducto.volumen_disponible} {subproducto.unidad_medida_abreviatura || 'kg'}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Cantidad</div>
              </div>

              <div
                style={{
                  backgroundColor: '#F3F4F6',
                  padding: '12px 20px',
                  borderRadius: '10px',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                  {subproducto.municipio || 'Medellín'}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Ubicación</div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                Descripción
              </h3>
              <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6 }}>
                {subproducto.descripcion || 'Sin descripción adicional disponible.'}
              </p>
            </div>

            <div style={{ marginTop: 'auto' }}>
              {isOwner ? (
                /* Wireframe 11: Vista Empresa Dueña */
                <button
                  onClick={() => navigate(`/subproductos/${subproducto.id}/editar`)}
                  style={{
                    width: '100%',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  Editar publicación
                </button>
              ) : (
                /* Wireframe 12: Vista Comprador -> Redirige al Chat (P2) */
                <button
                  onClick={() => navigate(`/chat/${subproducto.id}`)}
                  style={{
                    width: '100%',
                    backgroundColor: '#22C55E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  Contactar empresa
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
