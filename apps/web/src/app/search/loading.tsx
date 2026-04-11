import { SkeletonCardGrid } from '@/components/ui/SkeletonCard'

export default function SearchLoading() {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)', padding: '24px 32px', height: '130px' }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <SkeletonCardGrid count={9} />
      </div>
    </div>
  )
}
