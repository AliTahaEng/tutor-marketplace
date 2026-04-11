export function SkeletonCard() {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
        <div className="skeleton-shimmer" style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ height: '16px', borderRadius: '8px', marginBottom: '8px', width: '60%' }} />
          <div className="skeleton-shimmer" style={{ height: '12px', borderRadius: '8px', width: '80%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div className="skeleton-shimmer" style={{ height: '14px', borderRadius: '8px', width: '80px' }} />
        <div className="skeleton-shimmer" style={{ height: '18px', borderRadius: '8px', width: '70px' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div className="skeleton-shimmer" style={{ height: '24px', borderRadius: '9999px', width: '80px' }} />
        <div className="skeleton-shimmer" style={{ height: '24px', borderRadius: '9999px', width: '70px' }} />
      </div>
      <div className="skeleton-shimmer" style={{ height: '38px', borderRadius: '10px' }} />
    </div>
  )
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
