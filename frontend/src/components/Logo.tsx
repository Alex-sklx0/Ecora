type LogoProps = {
  wordmark?: boolean
  size?: number
}

export default function Logo({ wordmark = false, size = 42 }: LogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <img src="/logo.png" alt="Ecora" width={size} height={size} style={{ display: 'block' }} />
      {wordmark && (
        <span style={{ color: '#22C55E', fontWeight: 700, fontSize: '22px' }}>Ecora</span>
      )}
    </span>
  )
}
