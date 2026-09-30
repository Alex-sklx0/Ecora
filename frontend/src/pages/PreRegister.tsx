import { useNavigate } from 'react-router-dom'

export default function PreRegister() {
  const navigate = useNavigate()

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
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '32px' }}>
          Así que... cuéntanos, ¿Quién eres?
        </h2>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <div
            onClick={() => navigate('/person-registration')}
            style={{
              flex: 1,
              padding: '32px 16px',
              border: '2px solid #E5E7EB',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: '#F9FAFB',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#22C55E')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Persona</div>
          </div>

          <div
            onClick={() => navigate('/company-registration')}
            style={{
              flex: 1,
              padding: '32px 16px',
              border: '2px solid #E5E7EB',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: '#F9FAFB',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#22C55E')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Empresa</div>
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <span style={{ color: '#6B7280', fontSize: '14px' }}>¿Ya tienes cuenta? </span>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#22C55E',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  )
}
