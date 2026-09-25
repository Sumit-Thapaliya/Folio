import type { CanvasObject } from '../types'
import { textHeight } from './text'

export const SNAP = 5
export const GRID = 8
export const MIN_W = 24
export const MIN_SIZE = 6
export const MAX_SIZE = 160

export function snapGrid(n: number, grid = GRID): number {
  return Math.round(n / grid) * grid
}

export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function boxOf(object: CanvasObject): { w: number; h: number } {
  if (object.type === 'text') {
    return { w: object.w, h: textHeight(object.text || ' ', object.style, object.w) }
  }
  if (object.type === 'shape' && object.kind === 'line') {
    return { w: object.w, h: Math.max(8, object.h) }
  }
  return { w: object.w, h: object.h }
}

export function snapPosition(
  objects: CanvasObject[],
  objectId: string,
  x: number,
  y: number,
  w: number,
  h: number,
  pageW: number,
  pageH: number,
): { x: number; y: number; guideX: number[]; guideY: number[] } {
  const xs = [0, pageW / 2, pageW]
  const ys = [0, pageH / 2, pageH]
  for (const other of objects) {
    if (other.id === objectId) continue
    const box = boxOf(other)
    xs.push(other.x, other.x + box.w / 2, other.x + box.w)
    ys.push(other.y, other.y + box.h / 2, other.y + box.h)
  }

  const guideX: number[] = []
  const guideY: number[] = []
  let snappedX = x
  let snappedY = y

  for (const candidate of xs) {
    if (Math.abs(x - candidate) <= SNAP) {
      snappedX = candidate
      guideX.push(candidate)
      break
    }
    if (Math.abs(x + w / 2 - candidate) <= SNAP) {
      snappedX = candidate - w / 2
      guideX.push(candidate)
      break
    }
    if (Math.abs(x + w - candidate) <= SNAP) {
      snappedX = candidate - w
      guideX.push(candidate)
      break
    }
  }
  for (const candidate of ys) {
    if (Math.abs(y - candidate) <= SNAP) {
      snappedY = candidate
      guideY.push(candidate)
      break
    }
    if (Math.abs(y + h / 2 - candidate) <= SNAP) {
      snappedY = candidate - h / 2
      guideY.push(candidate)
      break
    }
    if (Math.abs(y + h - candidate) <= SNAP) {
      snappedY = candidate - h
      guideY.push(candidate)
      break
    }
  }
  return { x: snappedX, y: snappedY, guideX, guideY }
}
