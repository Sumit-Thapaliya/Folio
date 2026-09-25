export type Align = 'left' | 'center' | 'right'

export type FontId =
  | 'dm'
  | 'grotesk'
  | 'playfair'
  | 'baskerville'
  | 'cormorant'
  | 'fraunces'
  | 'mono'

export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'star' | 'line'

export interface PageSize {
  id: string
  name: string
  width: number
  height: number
}

export interface TextStyle {
  font: FontId
  size: number
  lineHeight: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color: string
  align: Align
  letterSpacing?: number
}

interface BaseObject {
  id: string
  x: number
  y: number
  opacity?: number
  locked?: boolean
  hidden?: boolean
  name?: string
  rotation?: number
  flipX?: boolean
  flipY?: boolean
}

export interface TextObject extends BaseObject {
  type: 'text'
  w: number
  text: string
  style: TextStyle
}

export interface ImageObject extends BaseObject {
  type: 'image'
  w: number
  h: number
  src: string
}

export interface ShapeObject extends BaseObject {
  type: 'shape'
  kind: ShapeKind
  w: number
  h: number
  fill: string
  stroke?: string
  strokeWidth?: number
  radius?: number
}

export type CanvasObject = TextObject | ImageObject | ShapeObject

export interface Page {
  id: string
  background: string
  objects: CanvasObject[]
}

export interface FolioDoc {
  id: string
  name: string
  size: PageSize
  pages: Page[]
  updatedAt: number
}

export type LooseObject = Omit<TextObject, 'id'> | Omit<ImageObject, 'id'> | Omit<ShapeObject, 'id'>

export interface Template {
  id: string
  name: string
  blurb: string
  category: string
  size: PageSize
  pages: Array<{ background: string; objects: LooseObject[] }>
}

export interface DocMeta {
  id: string
  name: string
  sizeName: string
  updatedAt: number
  thumbBackground: string
}
