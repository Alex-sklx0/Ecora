import type { Mensaje } from '../../services/chatApi'
import type { SolicitudIntercambioPayload } from '../../types'
import { useAuth } from '../../context/AuthContext'

interface Props {
  mensaje: Mensaje
  onAceptarSolicitud?: (solicitud: SolicitudIntercambioPayload) => void
  onPedirOtraOferta?: (solicitud: SolicitudIntercambioPayload) => void
}

export default function MessageBubble({ mensaje, onAceptarSolicitud, onPedirOtraOferta }: Props) {
  const { user } = useAuth()
  const esMio = mensaje.id_emisor === user?.id
  const hora = new Date(mensaje.created_at).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Verificar si el mensaje contiene una solicitud de intercambio
  let solicitud: SolicitudIntercambioPayload | null = null
  if (mensaje.contenido.startsWith('{') && mensaje.contenido.includes('solicitud_intercambio')) {
    try {
      const parsed = JSON.parse(mensaje.contenido)
      if (parsed.tipo === 'solicitud_intercambio') {
        solicitud = parsed as SolicitudIntercambioPayload
      }
    } catch {
      solicitud = null
    }
  }

  // Si es una solicitud de intercambio, renderizar la tarjeta especial (Wireframe 13)
  if (solicitud) {
    return (
      <div style={{ width: '100%', margin: '14px 0' }}>
        <div
          style={{
            backgroundColor: '#E0F2FE',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
            border: '1px solid #BAE6FD',
          }}
        >
          <div style={{ fontSize: '14px', color: '#0369A1', fontWeight: 600, marginBottom: '14px' }}>
            {esMio
              ? 'Has enviado una solicitud de intercambio:'
              : `${mensaje.nombre_emisor || 'La contraparte'} te ha enviado una solicitud de intercambio, revisa los detalles y confirma:`}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            {/* Cajas de datos */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  minWidth: '120px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Cantidad:</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {solicitud.cantidad} {solicitud.unidad || 'kg'}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {solicitud.material || 'Material'}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  minWidth: '120px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Precio:</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {Number(solicitud.precio).toLocaleString('es-CO')} $
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Pesos</div>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!esMio ? (
                <>
                  <button
                    type="button"
                    onClick={() => onPedirOtraOferta?.(solicitud!)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#0369A1',
                      border: '1px solid #7DD3FC',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    Otra oferta
                  </button>
                  <button
                    type="button"
                    onClick={() => onAceptarSolicitud?.(solicitud!)}
                    style={{
                      backgroundColor: '#22C55E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
                    }}
                  >
                    Confirmar intercambio
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#0284C7', fontWeight: 600 }}>
                    ● Esperando respuesta
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>{hora}</span>
          </div>
        </div>
      </div>
    )
  }

  // Mensaje normal de chat
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: esMio ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
      }}
    >
      {!esMio && mensaje.nombre_emisor && (
        <span style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px', marginLeft: '4px' }}>
          {mensaje.nombre_emisor}
        </span>
      )}
      <div
        style={{
          backgroundColor: esMio ? '#0F6E56' : '#F3F4F6',
          color: esMio ? '#FFFFFF' : '#111827',
          padding: '10px 16px',
          borderRadius: esMio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          maxWidth: '70%',
          fontSize: '14px',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {mensaje.contenido}
      </div>
      <span
        style={{
          fontSize: '10px',
          color: '#9CA3AF',
          marginTop: '2px',
          marginLeft: esMio ? 0 : '4px',
          marginRight: esMio ? '4px' : 0,
        }}
      >
        {hora}
        {esMio && (
          <span style={{ marginLeft: '4px' }}>{mensaje.leido ? '✓✓' : '✓'}</span>
        )}
      </span>
    </div>
  )
}
