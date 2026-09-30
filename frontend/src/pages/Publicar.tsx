import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { api } from '../services/api'

export default function Publicar() {
  const [nombre, setNombre] = useState('Recortes de algodón')
  const [volumen, setVolumen] = useState('250')
  const [idFamilia, setIdFamilia] = useState('5') // 5: Textiles
  const [idUnidad, setIdUnidad] = useState('1')   // 1: kg
  const [idFrecuencia, setIdFrecuencia] = useState('1') // 1: Una sola vez
  const [idMunicipio, setIdMunicipio] = useState('1')   // 1: Medellín
  const [precioInicial, setPrecioInicial] = useState('1500')
  const [descripcion, setDescripcion] = useState('')
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined)
  const [fileName, setFileName] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede superar 5 MB.')
        return
      }
      setFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageBase64(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await api.post<{ ok: boolean }>('/subproductos', {
        nombre,
        id_familia_material: Number(idFamilia),
        volumen_disponible: Number(volumen),
        id_unidad_medida: Number(idUnidad),
        id_frecuencia: Number(idFrecuencia),
        id_municipio: Number(idMunicipio),
        precio_inicial: Number(precioInicial),
        descripcion,
        image_base64: imageBase64,
      })

      if (res.ok) {
        navigate('/catalogo')
      }
    } catch (err: any) {
      setError(err.message || 'Error al publicar subproducto.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <Navbar />

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <Link
          to="/catalogo"
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
            Publicar material
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Tipo de material</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Recortes de algodón"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.label}>Familia de material</label>
                <select
                  value={idFamilia}
                  onChange={(e) => setIdFamilia(e.target.value)}
                  style={styles.input}
                >
                  <option value="5">Textiles</option>
                  <option value="1">Papel y cartón</option>
                  <option value="2">Plásticos</option>
                  <option value="3">Vidrio</option>
                  <option value="4">Metales</option>
                  <option value="6">Madera</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Cantidad disponible</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Ej. 250"
                  value={volumen}
                  onChange={(e) => setVolumen(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.label}>Unidad de medida</label>
                <select
                  value={idUnidad}
                  onChange={(e) => setIdUnidad(e.target.value)}
                  style={styles.input}
                >
                  <option value="1">Kilogramos (kg)</option>
                  <option value="2">Toneladas (t)</option>
                  <option value="3">Metros cúbicos (m3)</option>
                </select>
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
                  <option value="4">Envigado, Antioquia</option>
                </select>
              </div>
            </div>

            <div>
              <label style={styles.label}>Precio inicial por unidad ($ COP)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Ej. 1500"
                value={precioInicial}
                onChange={(e) => setPrecioInicial(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Descripción</label>
              <textarea
                rows={4}
                placeholder="Estado del material, condiciones de entrega, composición..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={styles.label}>Foto del material</label>
              <label
                style={{
                  border: '2px dashed #D1D5DB',
                  borderRadius: '12px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>📷</span>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>
                  {fileName ? `Archivo seleccionado: ${fileName}` : 'Arrastra una imagen aquí o selecciona un archivo'}
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Publicando...' : 'Publicar'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/catalogo')}
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar
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
