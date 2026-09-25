import type { ShapeObject } from '../types'

export function ShapeView({ object }: { object: ShapeObject }) {
  const stroke = object.stroke
  const sw = object.strokeWidth ?? 0
  const fill = object.fill || 'transparent'
  const opacity = object.opacity ?? 1

  if (object.kind === 'line') {
    return (
      <div
        className="pointer-events-none w-full"
        style={{
          height: Math.max(0.6, object.h),
          background: fill,
          opacity,
          marginTop: Math.max(0, (Math.max(8, object.h) - object.h) / 2),
        }}
      />
    )
  }

  if (object.kind === 'rect') {
    return (
      <div
        className="pointer-events-none h-full w-full"
        style={{
          background: fill,
          opacity,
          borderRadius: object.radius ?? 0,
          border: stroke && sw ? `${sw}px solid ${stroke}` : undefined,
        }}
      />
    )
  }

  if (object.kind === 'ellipse') {
    return (
      <div
        className="pointer-events-none h-full w-full"
        style={{
          background: fill,
          opacity,
          borderRadius: '50%',
          border: stroke && sw ? `${sw}px solid ${stroke}` : undefined,
        }}
      />
    )
  }

  if (object.kind === 'triangle') {
    return (
      <svg className="pointer-events-none h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points="50,4 96,96 4,96"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          opacity={opacity}
        />
      </svg>
    )
  }

  return (
    <svg className="pointer-events-none h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon
        points="50,4 61,35 96,35 68,55 79,91 50,70 21,91 32,55 4,35 39,35"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        opacity={opacity}
      />
    </svg>
  )
}
