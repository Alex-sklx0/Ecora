import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PreRegister() {
  const navigate = useNavigate()

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
          padding: '48px 56px',
          maxWidth: '640px',
          width: '100%',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '22px',
            left: '0',
            bottom: '22px',
            width: '18px',
            borderTop: '3px solid #22C55E',
            borderLeft: '3px solid #22C55E',
            borderBottom: '3px solid #22C55E',
            borderTopLeftRadius: '10px',
            borderBottomLeftRadius: '10px',
          }}
        />
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '36px' }}>
          Así que... cuéntanos, ¿Quién eres?
        </h2>

        <div style={{ display: 'flex', gap: '48px', justifyContent: 'center' }}>
          <Choice label="Persona" onClick={() => navigate('/person-registration')}>
            <img src="/user.png" alt="" width={56} height={56} />
          </Choice>
          <Choice label="Empresa" onClick={() => navigate('/company-registration')}>
            <GroupIcon />
          </Choice>
        </div>
      </div>
    </div>
  )
}

function Choice({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <span
        style={{
          width: '88px',
          height: '88px',
          borderRadius: '16px',
          backgroundColor: '#EEF4FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 18px rgba(59, 130, 246, 0.12)',
        }}
      >
        {children}
      </span>
      <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{label}</span>
    </button>
  )
}

function GroupIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#111827" strokeWidth="1.6">
      <circle cx="16" cy="16" r="5" />
      <circle cx="32" cy="17" r="4" />
      <path d="M6 34c1.2-5 4.5-7.5 10-7.5s8.8 2.5 10 7.5" />
      <path d="M28 27.5c3.2-.4 6.2 1.2 8 4.5" />
    </svg>
  )
}
