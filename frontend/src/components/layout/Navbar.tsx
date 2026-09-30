import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, tipoUsuario, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link to="/catalogo" style={styles.logoGroup}>
          <div style={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <span style={styles.logoText}>Ecora</span>
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
            🏠 Catalogo
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
          <Link to="/perfil" style={styles.iconBtn} title="Notificaciones">
            🔔
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/perfil" style={styles.avatarCircle}>
                👤
              </Link>
              <button
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
                style={styles.logoutBtn}
              >
                Salir
              </button>
            </div>
          ) : (
            <Link to="/login" style={styles.loginBtn}>
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#22C55E',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navPill: {
    padding: '8px 20px',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  activePill: {
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
  },
  inactivePill: {
    backgroundColor: '#E8F5E9',
    color: '#166534',
  },
  userActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBtn: {
    fontSize: '20px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  avatarCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
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
  logoutBtn: {
    background: 'none',
    border: '1px solid #D1D5DB',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
}
