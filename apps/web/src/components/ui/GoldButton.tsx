import Link from 'next/link'

interface GoldButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: 'solid' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  disabled?: boolean
  fullWidth?: boolean
}

export function GoldButton({
  href, onClick, children, variant = 'solid', size = 'md',
  type = 'button', disabled, fullWidth
}: GoldButtonProps) {
  const padding = size === 'sm' ? '8px 18px' : size === 'lg' ? '16px 36px' : '12px 28px'
  const fontSize = size === 'sm' ? '13px' : size === 'lg' ? '17px' : '15px'
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding,
    fontSize,
    fontWeight: 700,
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    border: 'none',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.6 : 1,
    ...(variant === 'solid' ? {
      background: 'var(--color-primary)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
    } : {
      background: 'transparent',
      color: 'var(--color-primary)',
      border: '2px solid var(--color-primary)',
    }),
  }

  if (href) {
    return <Link href={href} style={baseStyle}>{children}</Link>
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={baseStyle}>
      {children}
    </button>
  )
}
