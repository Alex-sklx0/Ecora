import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from '../services/authClient'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PersonRegistration() {
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [idMunicipio, setIdMunicipio] = useState('1')
  const [idRol, setIdRol] = useState('3')
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
      // 1. Registro en Better-Auth
      const signUpRes = await authClient.signUp.email({
        email,
        password,
        name: nombre,
      })

      if (signUpRes.error) {
        throw new Error(signUpRes.error.message || 'Error en el registro de usuario')
      }

      // 2. Registro del perfil Persona Natural
      const perRes = await api.post<{ ok: boolean }>('/personas', {
        nombre,
        cedula,
        id_municipio: Number(idMunicipio),
        id_rol: Number(idRol),
      })

      if (perRes.ok) {
        await refetch()
        navigate('/catalogo')
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo completar el registro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#EAECEE',
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
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22C55E' }}>Ecora</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginTop: '8px' }}>
            Háblanos de tu persona
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            Solo necesitamos los datos básicos para comenzar.
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
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.label}>Nombre completo</label>
            <input
              type="text"
              required
              placeholder="Ej. Inti Mateo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Cédula</label>
            <input
              type="text"
              required
              placeholder="Ej. 1234567890"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Ubicación</label>
              <select
                value={idMunicipio}
                onChange={(e) => setIdMunicipio(e.target.value)}
                style={styles.input}
              >
                <option value="1">Medellín</option>
                <option value="2">Bello</option>
                <option value="3">Itagüí</option>
                <option value="4">Envigado</option>
                <option value="5">Sabaneta</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={styles.label}>Tipo de actividad</label>
              <select
                value={idRol}
                onChange={(e) => setIdRol(e.target.value)}
                style={styles.input}
              >
                <option value="3">Reciclador</option>
                <option value="2">Transformador</option>
              </select>
            </div>
          </div>

          <div>
            <label style={styles.label}>Correo personal</label>
            <input
              type="email"
              required
              placeholder="contacto@personal.com"
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
              minLength={8}
              placeholder="Ej. Miclave123*"
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
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/pre-register')}
            style={{
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Volver
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
