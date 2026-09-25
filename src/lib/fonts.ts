import type { FontId, TextStyle } from '../types'

export const FONT_OPTIONS: Array<{ id: FontId; label: string; stack: string }> = [
  { id: 'dm', label: 'DM Sans', stack: '"DM Sans", system-ui, sans-serif' },
  { id: 'grotesk', label: 'Space Grotesk', stack: '"Space Grotesk", system-ui, sans-serif' },
  { id: 'playfair', label: 'Playfair', stack: '"Playfair Display", Georgia, serif' },
  { id: 'baskerville', label: 'Baskerville', stack: '"Libre Baskerville", Georgia, serif' },
  { id: 'cormorant', label: 'Cormorant', stack: '"Cormorant Garamond", Georgia, serif' },
  { id: 'fraunces', label: 'Fraunces', stack: '"Fraunces", Georgia, serif' },
  { id: 'mono', label: 'Mono', stack: '"JetBrains Mono", ui-monospace, monospace' },
]

const STACK: Record<FontId, string> = Object.fromEntries(
  FONT_OPTIONS.map((f) => [f.id, f.stack]),
) as Record<FontId, string>

export function fontStack(id: FontId | undefined): string {
  return STACK[id ?? 'dm']
}

export function cssFont(style: TextStyle): string {
  const italic = style.italic ? 'italic' : 'normal'
  const weight = style.bold ? 700 : 500
  return `${italic} ${weight} ${style.size}px ${fontStack(style.font)}`
}

export const SIZE_OPTIONS = [8, 9, 10, 11, 12, 14, 16, 18, 22, 28, 36, 48, 64, 80, 120]

export const TEXT_COLORS = [
  '#14110e',
  '#f6f1e8',
  '#5c564e',
  '#c45d32',
  '#2c4a3e',
  '#1d4ed8',
  '#9b1c1c',
  '#c4a574',
]

export const FILL_COLORS = [
  '#14110e',
  '#f6f1e8',
  '#c45d32',
  '#2c4a3e',
  '#d9c7a8',
  '#1c312b',
  '#7a1f1f',
  '#3b4a7a',
  '#e8ddd0',
  '#ffffff',
  '#0b0b0b',
  '#c4a574',
]
