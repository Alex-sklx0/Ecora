import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatApi, type Conversacion } from '../../services/chatApi'

export default function ChatList() {
  const navigate = useNavigate()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    chatApi
      .getConversaciones()
      .then((r) => setConversaciones(r.conversaciones))
      .catch((e) => setError(e.message ?? 'Error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Cargando chats...</p>
  }
  if (error) {
    return <p style={{ textAlign: 'center', padding: '40px', color: '#DC2626' }}>{error}</p>
  }
  if (conversaciones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6B7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
        <p style={{ fontWeight: 600 }}>Aún no tienes conversaciones.</p>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>
          Contacta a una empresa desde el catálogo para iniciar un chat.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {conversaciones.map((c) => (
        <button
          key={c.id}
          onClick={() => navigate(`/chat/${c.id}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0FDF4')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          {/* Avatar */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#065F46',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            {c.contraparte.nombre.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                {c.contraparte.nombre}
              </span>
              <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>
                {new Date(c.ultimo_mensaje_at).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '240px',
                }}
              >
                {c.ultimo_contenido ?? 'Sin mensajes aún'}
              </span>
              {c.no_leidos > 0 && (
                <span
                  style={{
                    backgroundColor: '#22C55E',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    minWidth: '20px',
                    height: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    padding: '0 4px',
                  }}
                >
                  {c.no_leidos > 9 ? '9+' : c.no_leidos}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
