import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { api } from '../services/api'
import { Subproducto } from '../types'

export default function Catalogo() {
  const [subproductos, setSubproductos] = useState<Subproducto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('Todos')

  const fetchCatalogo = async (query = '', tag = 'Todos') => {
    setLoading(true)
    try {
      let url = '/catalogo?'
      if (query) url += `q=${encodeURIComponent(query)}&`
      if (tag === 'Medellín') url += `municipio=${encodeURIComponent(tag)}&`
      else if (tag !== 'Todos') url += `familia=${encodeURIComponent(tag)}&`

      const res = await api.get<{ ok: boolean; subproductos: Subproducto[] }>(url)
      if (res.ok) {
        setSubproductos(res.subproductos || [])
      }
    } catch (err) {
      console.error('Error cargando catálogo:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalogo()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCatalogo(search, selectedTag)
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag)
    fetchCatalogo(search, tag)
  }

  const tags = ['Todos', 'Textil', 'Plástico', 'Cartón', 'Medellín']

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F6F4' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <p style={{ color: '#6B7280', fontSize: '15px', marginBottom: '16px' }}>
          Encuentra subproductos disponibles cerca de tu empresa.
        </p>

        {/* Buscador */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Buscar material, empresa o sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '15px',
              outline: 'none',
              backgroundColor: '#FFFFFF',
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Buscar
          </button>
        </form>

        {/* Filtros de Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: selectedTag === tag ? '#22C55E' : '#FFFFFF',
                color: selectedTag === tag ? '#FFFFFF' : '#166534',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Listado de tarjetas */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Cargando catálogo...</div>
        ) : subproductos.length === 0 ? (
          /* Wireframe 10: Sin resultados */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '60px 20px',
              textAlign: 'center',
              maxWidth: '540px',
              margin: '40px auto',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '16px',
                border: '2px solid #22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 20px auto',
                color: '#22C55E',
              }}
            >
              📦❓
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              No se encontraron resultados a lo que buscas.
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Prueba buscar otro subproducto.</p>
          </div>
        ) : (
          /* Grid de productos Wireframe 09 */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {subproductos.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Imagen del producto */}
                <div
                  style={{
                    height: '180px',
                    backgroundColor: '#D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {item.foto_url ? (
                    <img
                      src={item.foto_url}
                      alt={item.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '54px' }}>🧵</span>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      left: '16px',
                      bottom: '14px',
                      backgroundColor: '#E7F6EC',
                      color: '#15803D',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '12px',
                    }}
                  >
                    {item.familia_material || 'Textil'}
                  </span>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                    {item.nombre}
                  </h3>

                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                    {item.volumen_disponible} {item.unidad_medida_abreviatura || 'kg'}
                  </div>

                  <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                    {item.empresa_nombre || 'Fibretex'} · {item.municipio || 'Medellín'}
                  </p>

                  <Link
                    to={`/catalogo/${item.id}`}
                    style={{
                      marginTop: 'auto',
                      alignSelf: 'flex-start',
                      backgroundColor: '#22C55E',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
