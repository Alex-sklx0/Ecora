import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../Logo'

const notifications = [
  {
    title: 'Nueva empresa busca recortes de algodón',
    body: 'Rochevi tiene una necesidad compatible con tu publicación. Compatibilidad estimada: 94%.',
    time: 'Hace 10 min',
    action: 'Ver match',
    to: '/matching',
  },
  {
    title: 'Material disponible cerca de ti',
    body: 'Se publicaron 3 nuevos materiales en Medellín relacionados con tu sector.',
    time: 'Ayer',
    action: 'Explorar catálogo',
    to: '/catalogo',
  },
]

export default function Navbar() {
  const { user, tipoUsuario } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [openNotes, setOpenNotes] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <header style={styles.header}>
        <div style={styles.container}>
          <Link to="/catalogo" style={styles.logoLink} aria-label="Ecora">
            <Logo size={40} />
          </Link>

          <nav style={styles.navLinks}>
            {tipoUsuario === 'empresa' && (
              <Link
                to="/publicar"
                style={{
                  ...styles.navPill,
                  ...(isActive('/publicar') ? styles.activePill : styles.inactivePill),
                }}
              >
                + Publicar
              </Link>
            )}

            <Link
              to="/catalogo"
              style={{
                ...styles.navPill,
                ...(isActive('/catalogo') ? styles.activePill : styles.inactivePill),
              }}
            >
              <HomeIcon active={isActive('/catalogo')} /> Catalogo
            </Link>

            <Link
              to="/matching"
              style={{
                ...styles.navPill,
                ...(isActive('/matching') ? styles.activePill : styles.inactivePill),
              }}
            >
              ↔ Matching
            </Link>
          </nav>

          <div style={styles.userActions}>
            <button
              type="button"
              onClick={() => setOpenNotes(true)}
              style={styles.iconBtn}
              aria-label="Notificaciones"
            >
              <BellIcon />
            </button>

            {user ? (
              <Link to="/perfil" style={styles.avatarCircle} aria-label="Perfil">
                <UserIcon />
              </Link>
            ) : (
              <Link to="/login" style={styles.loginBtn}>
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      {openNotes && (
        <div style={styles.noteOverlay} onClick={() => setOpenNotes(false)}>
          <div style={styles.notePanel} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>Notificaciones</h2>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              Mantente al tanto de nuevas oportunidades.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((note) => (
                <div key={note.title} style={styles.noteCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <strong style={{ fontSize: '14px' }}>{note.title}</strong>
                    <span style={{ color: '#9CA3AF', fontSize: '12px', whiteSpace: 'nowrap' }}>{note.time}</span>
                  </div>
                  <p style={{ color: '#4B5563', fontSize: '13px', margin: '8px 0 12px' }}>{note.body}</p>
                  <button
                    type="button"
                    style={styles.noteAction}
                    onClick={() => {
                      setOpenNotes(false)
                      navigate(note.to)
                    }}
                  >
                    {note.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#166534'} strokeWidth="2">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.8">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19" />
    </svg>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '14px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    borderRadius: '999px',
    fontSize: '15px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  activePill: {
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
  },
  inactivePill: {
    backgroundColor: '#E7F6EC',
    color: '#166534',
  },
  userActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
  },
  avatarCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
  loginBtn: {
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    padding: '8px 18px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    textDecoration: 'none',
  },
  noteOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    zIndex: 200,
    display: 'flex',
    justifyContent: 'center',
    padding: '88px 24px 24px',
  },
  notePanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '28px',
    width: 'min(640px, 100%)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
    alignSelf: 'flex-start',
  },
  noteCard: {
    backgroundColor: '#F3FAF6',
    borderRadius: '14px',
    padding: '16px',
  },
  noteAction: {
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
}
