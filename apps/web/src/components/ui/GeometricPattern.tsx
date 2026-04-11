interface GeometricPatternProps {
  opacity?: number
  color?: string
}

export function GeometricPattern({ opacity = 0.04, color = '#d97706' }: GeometricPatternProps) {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,16 58,44 30,58 2,44 2,16" fill="none" stroke={color} strokeWidth="1" />
          <polygon points="30,14 46,22 46,38 30,46 14,38 14,22" fill="none" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geo)" />
    </svg>
  )
}
