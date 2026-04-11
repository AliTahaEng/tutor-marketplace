interface SectionHeadingProps {
  title: string
  subtitle?: string
  centered?: boolean
}

export function SectionHeading({ title, subtitle, centered }: SectionHeadingProps) {
  return (
    <div style={{ textAlign: centered ? 'center' : 'left', marginBottom: '40px' }}>
      <h2 style={{
        fontSize: '36px',
        fontWeight: 800,
        color: 'var(--color-text)',
        lineHeight: 1.2,
        letterSpacing: '-0.5px',
        margin: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize: '17px',
          color: 'var(--color-text-muted)',
          marginTop: '12px',
          lineHeight: 1.6,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
