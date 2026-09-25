import type { TextStyle } from '../types'
import { cssFont } from './fonts'

let measureCtx: CanvasRenderingContext2D | null = null

function ctx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (!measureCtx) {
    const canvas = document.createElement('canvas')
    measureCtx = canvas.getContext('2d')
  }
  return measureCtx
}

export function wrapLines(text: string, style: TextStyle, width: number): string[] {
  const paragraphs = (text ?? '').split('\n')
  const context = ctx()
  if (context) context.font = cssFont(style)
  const lines: string[] = []
  const max = Math.max(8, width)

  for (const para of paragraphs) {
    if (para === '') {
      lines.push('')
      continue
    }
    const words = para.split(/\s+/)
    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      const measured = context ? context.measureText(next).width : next.length * style.size * 0.52
      if (measured <= max) {
        current = next
      } else {
        if (current) lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)
  }
  return lines.length ? lines : ['']
}

export function textHeight(text: string, style: TextStyle, width: number): number {
  const lines = wrapLines(text || ' ', style, width)
  const lh = style.size * (style.lineHeight || 1.3)
  return Math.max(lh, lines.length * lh)
}

export function measureLineWidth(text: string, style: TextStyle): number {
  const context = ctx()
  const lines = (text || 'W').split('\n')
  let max = 0
  if (context) {
    context.font = cssFont(style)
    for (const line of lines) {
      max = Math.max(max, context.measureText(line || 'W').width)
    }
    return max
  }
  for (const line of lines) {
    max = Math.max(max, (line.length || 1) * style.size * 0.56)
  }
  return max
}

export function fittedTextWidth(text: string, style: TextStyle, maxWidth: number): number {
  const raw = Math.ceil(measureLineWidth(text || 'W', style) + 8)
  const max = Math.max(24, maxWidth)
  return Math.min(max, Math.max(24, raw))
}
