import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from '../services/authClient'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const { refetch } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      })

      if (res.error) {
        throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.')
      }

      await refetch()
      navigate('/catalogo')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3F6F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Logo wordmark size={36} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginTop: '8px' }}>
            Inicio de sesión
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            Encuentra, publica e intercambia subproductos aprovechables.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.label}>Correo</label>
            <input
              type="email"
              required
              placeholder="contacto@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginTop: '8px',
            }}
          >
            {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', margin: '8px 0' }}>o</div>

          <button
            type="button"
            onClick={() => navigate('/pre-register')}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#22C55E',
              border: '1.5px solid #22C55E',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Registrar mi empresa
          </button>
        </form>
      </div>
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
    outline: 'none',
    boxSizing: 'border-box',
  },
}
