interface SubjectPillProps {
  label: string
  active?: boolean
  onClick?: () => void
  icon?: string
}

export function SubjectPill({ label, active, onClick, icon }: SubjectPillProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '6px 14px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        background: active ? 'var(--color-primary)' : 'var(--color-primary-light)',
        color: active ? '#fff' : '#92400e',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-gold-bright)'}`,
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  )
}
