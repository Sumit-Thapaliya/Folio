import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function FloatingBar({
  pageEl,
  x,
  y,
  w,
  h,
  zoom,
  children,
}: {
  pageEl: HTMLElement | null
  x: number
  y: number
  w: number
  h: number
  zoom: number
  children: ReactNode
}) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState({ left: 0, top: 0, ready: false })

  useLayoutEffect(() => {
    const place = () => {
      const bar = barRef.current
      if (!pageEl || !bar) return
      const page = pageEl.getBoundingClientRect()
      const barW = bar.offsetWidth || 360
      const barH = bar.offsetHeight || 44
      const pad = 8
      const objLeft = page.left + x * zoom
      const objTop = page.top + y * zoom
      const objW = w * zoom
      const objH = h * zoom

      let top = objTop - barH - 10
      if (top < pad) top = objTop + objH + 10
      if (top + barH > window.innerHeight - pad) {
        top = Math.max(pad, window.innerHeight - barH - pad)
      }

      let left = objLeft + objW / 2 - barW / 2
      left = Math.min(window.innerWidth - barW - pad, Math.max(pad, left))
      setPos({ left, top, ready: true })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [pageEl, x, y, w, h, zoom, children])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={barRef}
      data-floating-bar
      className="fixed z-80 flex max-w-[calc(100vw-16px)] flex-wrap items-center gap-1 rounded-2xl border border-ink/10 bg-[#fbf8f2] px-1.5 py-1 shadow-xl"
      style={{
        left: pos.left,
        top: pos.top,
        visibility: pos.ready ? 'visible' : 'hidden',
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  )
}
