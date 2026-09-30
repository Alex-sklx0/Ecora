import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { Subproducto } from '../types'

export default function Perfil() {
  const { user, empresa, persona, tipoUsuario } = useAuth()
  const [publicaciones, setPublicaciones] = useState<Subproducto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMisPubs = async () => {
      if (tipoUsuario === 'empresa') {
        try {
          const res = await api.get<{ ok: boolean; subproductos: Subproducto[] }>(
            '/subproductos/mis-publicaciones'
          )
          if (res.ok) setPublicaciones(res.subproductos)
        } catch (err) {
          console.error('Error cargando publicaciones:', err)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    fetchMisPubs()
  }, [tipoUsuario])

  const nombrePerfil = empresa?.nombre || persona?.nombre || user?.name || 'Mi Perfil'
  const ciudad = 'Medellín'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
      <Navbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
          {nombrePerfil}
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
          Gestiona publicaciones, contactos e historial.
        </p>

        {/* Dashboard Grid (Wireframe 20) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(280px, 1.2fr) minmax(200px, 0.8fr)', gap: '24px', marginBottom: '24px' }}>
          {/* Card Perfil */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  fontSize: '24px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {nombrePerfil.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{nombrePerfil}</h3>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>Textil · {ciudad}</span>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.6, marginBottom: '16px' }}>
              <div><strong>Tipo:</strong> {tipoUsuario === 'empresa' ? 'Generador y aprovechador' : 'Persona Natural'}</div>
              <div><strong>Contacto:</strong> {user?.email}</div>
            </div>
          </div>

          {/* Card Resumen de Métricas */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
                {publicaciones.length}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>Publicaciones</div>
            </div>

            <div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>12</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>Matches</div>
            </div>

            <div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>3</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>Contactos</div>
            </div>

            <div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>1.2 t</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>Material aprovechado</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              gap: '10px',
              minHeight: '220px',
            }}
          >
            {[40, 70, 55, 90, 120].map((height) => (
              <div
                key={height}
                style={{
                  width: '28px',
                  height: `${height}px`,
                  backgroundColor: '#22C55E',
                  borderRadius: '6px 6px 0 0',
                }}
              />
            ))}
          </div>
        </div>

        {/* Tabla Mis publicaciones (Wireframe 20) */}
        {tipoUsuario === 'empresa' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
              Mis publicaciones
            </h3>

            {loading ? (
              <div>Cargando publicaciones...</div>
            ) : publicaciones.length === 0 ? (
              <div style={{ color: '#6B7280', fontSize: '14px', padding: '20px 0' }}>
                No tienes publicaciones activas.{' '}
                <Link to="/publicar" style={{ color: '#22C55E', fontWeight: 600 }}>
                  Crear publicación
                </Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '13px' }}>
                    <th style={{ padding: '12px 8px' }}>Material</th>
                    <th style={{ padding: '12px 8px' }}>Cantidad</th>
                    <th style={{ padding: '12px 8px' }}>Estado</th>
                    <th style={{ padding: '12px 8px' }}>Matches</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {publicaciones.map((pub) => (
                    <tr key={pub.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 8px', fontWeight: 600, color: '#111827' }}>
                        {pub.nombre}
                      </td>
                      <td style={{ padding: '14px 8px', color: '#4B5563' }}>
                        {pub.volumen_disponible} {pub.unidad_medida_abreviatura || 'kg'}
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span
                          style={{
                            backgroundColor: pub.disponible ? '#DCFCE7' : '#FEF3C7',
                            color: pub.disponible ? '#15803D' : '#B45309',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '12px',
                          }}
                        >
                          {pub.disponible ? 'Activa' : 'Sin Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', color: '#4B5563' }}>—</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                        <Link
                          to={`/subproductos/${pub.id}/editar`}
                          style={{
                            backgroundColor: '#E7F6EC',
                            color: '#15803D',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Editar publicación
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Certificaciones (Wireframe 20) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            padding: '28px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              Certificaciones
            </h3>
            <p style={{ color: '#4B5563', fontSize: '14px', maxWidth: '440px', lineHeight: 1.5 }}>
              Para generar un certificado de cumplimiento ambiental debes cumplir 500 kg aprovechados.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                backgroundColor: '#F3F4F6',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '12px',
              }}
            >
              1.2 toneladas / 500 kg
            </div>
            <button
              onClick={() => alert('Certificado de cumplimiento ambiental descargado (Simulado).')}
              style={{
                backgroundColor: '#22C55E',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Descargar certificado
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
