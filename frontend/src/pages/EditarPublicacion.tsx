import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { api } from '../services/api'
import { Subproducto } from '../types'

export default function EditarPublicacion() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [volumen, setVolumen] = useState('')
  const [idFrecuencia, setIdFrecuencia] = useState('1')
  const [idMunicipio, setIdMunicipio] = useState('1')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await api.get<{ ok: boolean; subproducto: Subproducto }>(`/subproductos/${id}`)
        if (res.ok && res.subproducto) {
          const s = res.subproducto
          setNombre(s.nombre)
          setVolumen(String(s.volumen_disponible))
          setIdFrecuencia(String(s.id_frecuencia || 1))
          setIdMunicipio(String(s.id_municipio || 1))
          setDescripcion(s.descripcion || '')
        }
      } catch (err: any) {
        setError(err.message || 'Error cargando publicación.')
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.patch<{ ok: boolean }>(`/subproductos/${id}`, {
        nombre,
        volumen_disponible: Number(volumen),
        id_frecuencia: Number(idFrecuencia),
        id_municipio: Number(idMunicipio),
        descripcion,
      })

      if (res.ok) {
        navigate('/perfil')
      }
    } catch (err: any) {
      setError(err.message || 'Error actualizando publicación.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este subproducto?')) return
    try {
      const res = await api.delete<{ ok: boolean }>(`/subproductos/${id}`)
      if (res.ok) {
        navigate('/perfil')
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar.')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
      <Navbar />

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <Link
          to="/perfil"
          style={{
            color: '#22C55E',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '16px',
            display: 'inline-block',
          }}
        >
          ← Volver al inicio
        </Link>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Actualizar material
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
            Describe el subproducto para encontrar empresas interesadas.
          </p>

          {error && (
            <div
              style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Tipo de material</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.label}>Cantidad disponible (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={volumen}
                  onChange={(e) => setVolumen(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Frecuencia</label>
                <select
                  value={idFrecuencia}
                  onChange={(e) => setIdFrecuencia(e.target.value)}
                  style={styles.input}
                >
                  <option value="1">Una sola vez</option>
                  <option value="2">Diario</option>
                  <option value="3">Semanal</option>
                  <option value="4">Mensual</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.label}>Ubicación</label>
                <select
                  value={idMunicipio}
                  onChange={(e) => setIdMunicipio(e.target.value)}
                  style={styles.input}
                >
                  <option value="1">Medellín, Antioquia</option>
                  <option value="2">Bello, Antioquia</option>
                  <option value="3">Itagüí, Antioquia</option>
                </select>
              </div>
            </div>

            <div>
              <label style={styles.label}>Descripción</label>
              <textarea
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDelete}
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Eliminar
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  marginLeft: 'auto',
                }}
              >
                {submitting ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
}
