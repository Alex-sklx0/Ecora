import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

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
        gap: '12px',
      }}
    >
      <Logo size={92} />
      <h1 style={{ fontSize: '28px', color: '#22C55E', fontWeight: 600 }}>Ecora</h1>
    </div>
  )
}
