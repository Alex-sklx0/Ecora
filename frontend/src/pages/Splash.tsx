import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding')
    }, 1800)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div
      onClick={() => navigate('/onboarding')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        cursor: 'pointer',
      }}
    >
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
      <h1 style={{ fontSize: '32px', color: '#22C55E', marginTop: '16px', fontWeight: 700 }}>
        Ecora
      </h1>
    </div>
  )
}
