import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  Check,
  Copy,
  Download,
  Grid3x3,
  ImagePlus,
  Italic,
  Maximize,
  PanelLeft,
  Play,
  Plus,
  Redo2,
  Trash2,
  Underline,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type {
  CanvasObject,
  FolioDoc,
  FontId,
  Page,
  ShapeKind,
  TextObject,
  TextStyle,
} from '../types'
import { boxOf, GRID, MAX_SIZE, MIN_SIZE, MIN_W, rectsOverlap, snapGrid, snapPosition } from '../lib/geometry'
import { textHeight } from '../lib/text'
import { FONT_OPTIONS, SIZE_OPTIONS, TEXT_COLORS, cssFont, fontStack } from '../lib/fonts'
import { clone, uid } from '../lib/util'
import { saveDoc } from '../lib/storage'
import { downloadJson, downloadPdf, downloadPng } from '../lib/export'
import { TEMPLATES, instantiateTemplate } from '../lib/templates'
import { cn } from '../lib/cn'
import { EditableText } from './EditableText'
import { FloatingBar } from './FloatingBar'
import { ObjectVisual } from './ObjectLayer'
import { Inspector } from './Inspector'
import { PreviewMode } from './PreviewMode'
import { Sidebar, type PanelId } from './Sidebar'

const PAGE_GAP = 36
const ZOOM_MIN = 0.2
const ZOOM_MAX = 1.8
const DEFAULT_LH = 1.3

function fittedTextWidth(text: string, style: TextStyle, maxWidth: number): number {
  const sample = text || 'W'
  let width = sample.length * style.size * 0.56
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context) {
      context.font = cssFont(style)
      width = Math.max(...sample.split('\n').map((line) => context.measureText(line || 'W').width), 0)
    }
  }
  const max = Math.max(24, maxWidth)
  return Math.min(max, Math.max(24, Math.ceil(width + 8)))
}

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const
type HandleId = (typeof HANDLES)[number]
const HANDLE_CURSORS: Record<HandleId, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
}

function findObject(doc: FolioDoc, id: string | null) {
  if (!id) return null
  for (let pageIndex = 0; pageIndex < doc.pages.length; pageIndex += 1) {
    const index = doc.pages[pageIndex].objects.findIndex((object) => object.id === id)
    if (index >= 0) return { pageIndex, index, object: doc.pages[pageIndex].objects[index] }
  }
  return null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read that image.'))
    image.src = src
  })
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

export function Editor({
  initial,
  onBack,
}: {
  initial: FolioDoc
  onBack: (doc: FolioDoc) => void
}) {
  const [doc, setDoc] = useState<FolioDoc>(initial)
  const [past, setPast] = useState<FolioDoc[]>([])
  const [future, setFuture] = useState<FolioDoc[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.7)
  const [fit, setFit] = useState(true)
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] })
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [panel, setPanel] = useState<PanelId>('text')
  const [exporting, setExporting] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved')
  const [gridOn, setGridOn] = useState(false)
  const [gridSnap, setGridSnap] = useState(true)
  const [marginsOn, setMarginsOn] = useState(true)
  const [preview, setPreview] = useState(false)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [marquee, setMarquee] = useState<{
    pageIndex: number
    x0: number
    y0: number
    x1: number
    y1: number
  } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null)
  const selectedId = selectedIds[selectedIds.length - 1] ?? null
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const spaceRef = useRef(false)
  const panRef = useRef<{ x: number; y: number; sl: number; st: number } | null>(null)
  const jsonRef = useRef<HTMLInputElement | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Array<HTMLDivElement | null>>([])
  const fileRef = useRef<HTMLInputElement | null>(null)
  const replaceRef = useRef(false)
  const docRef = useRef(doc)
  docRef.current = doc

  const selected = useMemo(() => findObject(doc, selectedId), [doc, selectedId])
  const PAGE_W = doc.size.width
  const PAGE_H = doc.size.height

  const snapshot = useCallback(() => {
    setPast((stack) => [...stack.slice(-49), clone(docRef.current)])
    setFuture([])
  }, [])

  const live = useCallback((mutate: (draft: FolioDoc) => void) => {
    setDoc((current) => {
      const draft = clone(current)
      mutate(draft)
      return draft
    })
  }, [])

  const edit = useCallback(
    (mutate: (draft: FolioDoc) => void) => {
      snapshot()
      live(mutate)
    },
    [live, snapshot],
  )

  const undo = useCallback(() => {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    setPast((stack) => {
      if (!stack.length) return stack
      const previous = stack[stack.length - 1]
      setFuture((redoStack) => [...redoStack, clone(docRef.current)])
      setDoc(previous)
      return stack.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    setFuture((stack) => {
      if (!stack.length) return stack
      const next = stack[stack.length - 1]
      setPast((undoStack) => [...undoStack, clone(docRef.current)])
      setDoc(next)
      return stack.slice(0, -1)
    })
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const apply = () => {
      if (!fit) return
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      const next = Math.min((width - 80) / PAGE_W, (height - 80) / PAGE_H)
      setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)))
    }
    apply()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(apply) : null
    observer?.observe(container)
    return () => observer?.disconnect()
  }, [fit, PAGE_W, PAGE_H])

  useEffect(() => {
    setSaveState('saving')
    const t = window.setTimeout(() => {
      saveDoc(doc)
      setSaveState('saved')
    }, 900)
    return () => window.clearTimeout(t)
  }, [doc])

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(t)
  }, [notice])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      event.preventDefault()
      setFit(false)
      const next = event.deltaY > 0 ? -0.08 : 0.08
      setZoom((value) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((value + next) * 100) / 100)))
    }
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [])

  const pointInPage = useCallback(
    (clientX: number, clientY: number, pageIndex: number) => {
      const element = pageRefs.current[pageIndex]
      if (!element) return { x: 0, y: 0 }
      const rect = element.getBoundingClientRect()
      return {
        x: (clientX - rect.left) / (zoom || 1),
        y: (clientY - rect.top) / (zoom || 1),
      }
    },
    [zoom],
  )

  const pageIndexAt = useCallback((clientY: number) => {
    const elements = pageRefs.current.filter(Boolean) as HTMLDivElement[]
    for (let index = 0; index < elements.length; index += 1) {
      const rect = elements[index].getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) return index
    }
    if (!elements.length) return 0
    const first = elements[0].getBoundingClientRect()
    return clientY < first.top ? 0 : elements.length - 1
  }, [])

  const dragRef = useRef<{
    pointerId: number
    mode: 'move' | 'resize'
    handle?: HandleId
    objectId: string
    pageIndex: number
    startX: number
    startY: number
    moved: boolean
    wasSelected: boolean
    ids: string[]
    origins: Record<string, { x: number; y: number }>
    origin: { x: number; y: number; w: number; h: number; size?: number }
  } | null>(null)

  const startMove = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      pageIndex: number,
      object: CanvasObject,
      wasSelected: boolean,
      ids: string[],
    ) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (editingId === object.id || object.locked) return
      event.preventDefault()
      event.stopPropagation()
      const box = boxOf(object)
      const point = pointInPage(event.clientX, event.clientY, pageIndex)
      const moveIds = ids.length ? ids : [object.id]
      const origins: Record<string, { x: number; y: number }> = {}
      for (const id of moveIds) {
        const found = findObject(docRef.current, id)
        if (found) origins[id] = { x: found.object.x, y: found.object.y }
      }
      dragRef.current = {
        pointerId: event.pointerId,
        mode: 'move',
        objectId: object.id,
        pageIndex,
        startX: point.x,
        startY: point.y,
        moved: false,
        wasSelected,
        ids: moveIds,
        origins,
        origin: {
          x: object.x,
          y: object.y,
          w: box.w,
          h: box.h,
          size: object.type === 'text' ? object.style.size : undefined,
        },
      }
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* optional */
      }
    },
    [editingId, pointInPage],
  )

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>, pageIndex: number, object: CanvasObject, handle: HandleId) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (object.locked) return
      event.preventDefault()
      event.stopPropagation()
      const box = boxOf(object)
      const point = pointInPage(event.clientX, event.clientY, pageIndex)
      dragRef.current = {
        pointerId: event.pointerId,
        mode: 'resize',
        handle,
        objectId: object.id,
        pageIndex,
        startX: point.x,
        startY: point.y,
        origin: {
          x: object.x,
          y: object.y,
          w: box.w,
          h: box.h,
          size: object.type === 'text' ? object.style.size : undefined,
        },
        moved: false,
        wasSelected: false,
        ids: [object.id],
        origins: { [object.id]: { x: object.x, y: object.y } },
      }
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* optional */
      }
      snapshot()
    },
    [pointInPage, snapshot],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      event.preventDefault()
      const current = docRef.current
      const point = pointInPage(event.clientX, event.clientY, drag.pageIndex)
      const dx = point.x - drag.startX
      const dy = point.y - drag.startY
      const { origin } = drag
      if (!drag.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        if (drag.mode === 'move') snapshot()
        drag.moved = true
      }
      if (drag.mode === 'move' && !drag.moved) return

      if (drag.mode === 'move') {
        let rawX = origin.x + dx
        let rawY = origin.y + dy
        if (gridOn && gridSnap) {
          rawX = snapGrid(rawX)
          rawY = snapGrid(rawY)
        }
        const snapped = snapPosition(
          current.pages[drag.pageIndex].objects,
          drag.objectId,
          rawX,
          rawY,
          origin.w,
          origin.h,
          PAGE_W,
          PAGE_H,
        )
        setGuides({ x: snapped.guideX, y: snapped.guideY })
        const ddx = snapped.x - origin.x
        const ddy = snapped.y - origin.y
        const targetPage = pageIndexAt(event.clientY)
        live((draft) => {
          for (const id of drag.ids) {
            const found = findObject(draft, id)
            if (!found || found.object.locked) continue
            const from = drag.origins[id] ?? { x: found.object.x, y: found.object.y }
            found.object.x = from.x + ddx
            found.object.y =
              targetPage === drag.pageIndex
                ? from.y + ddy
                : from.y + ddy + (drag.pageIndex - targetPage) * (PAGE_H + PAGE_GAP)
          }
          if (targetPage !== drag.pageIndex && draft.pages[targetPage] && drag.ids.length === 1) {
            const page = draft.pages[drag.pageIndex]
            const index = page.objects.findIndex((object) => object.id === drag.objectId)
            if (index >= 0) {
              const [moved] = page.objects.splice(index, 1)
              draft.pages[targetPage].objects.push(moved)
              dragRef.current = { ...drag, pageIndex: targetPage }
            }
          }
        })
        return
      }

      const handle = drag.handle ?? 'se'
      const west = handle.includes('w')
      const east = handle.includes('e')
      const north = handle.includes('n')
      const south = handle.includes('s')

      live((draft) => {
        const page = draft.pages[drag.pageIndex]
        const index = page.objects.findIndex((object) => object.id === drag.objectId)
        if (index < 0) return
        const object = page.objects[index]
        const isCorner = (west || east) && (north || south) && handle.length === 2

        if (object.type === 'text') {
          if (isCorner) {
            const nextW = Math.max(MIN_W, origin.w + (east ? dx : -dx))
            const factor = nextW / origin.w
            const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, (origin.size ?? object.style.size) * factor))
            const grown = Math.max(MIN_W, origin.w * (size / (origin.size ?? object.style.size)))
            object.w = grown
            object.style = { ...object.style, size: Math.round(size * 10) / 10 }
            if (west) object.x = origin.x + origin.w - grown
            if (north) object.y = origin.y + origin.h - textHeight(object.text, object.style, grown)
          } else if (east || west) {
            const nextW = Math.max(MIN_W, origin.w + (east ? dx : -dx))
            object.w = nextW
            if (west) object.x = origin.x + origin.w - nextW
          } else {
            object.y = Math.max(0, origin.y + (south ? dy : -dy))
          }
          return
        }

        const ratio = origin.w / Math.max(1, origin.h)
        let nextW = origin.w + (east ? dx : west ? -dx : 0)
        let nextH = origin.h + (south ? dy : north ? -dy : 0)
        if (object.type === 'shape' && object.kind === 'line') {
          object.w = Math.max(MIN_W, origin.w + (east ? dx : west ? -dx : 0))
          if (west) object.x = origin.x + origin.w - object.w
          return
        }
        if (isCorner && !event.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) nextH = nextW / ratio
          else nextW = nextH * ratio
        }
        nextW = Math.max(MIN_W, nextW)
        nextH = Math.max(16, nextH)
        if (west) object.x = origin.x + origin.w - nextW
        if (north) object.y = origin.y + origin.h - nextH
        object.w = nextW
        object.h = nextH
      })
    },
    [PAGE_H, PAGE_W, gridOn, gridSnap, live, pageIndexAt, pointInPage, snapshot],
  )

  const endDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const clicked = drag.mode === 'move' && !drag.moved
    const id = drag.objectId
    dragRef.current = null
    setGuides({ x: [], y: [] })
    if (!clicked) return
    const found = findObject(docRef.current, id)
    if (found && found.object.type === 'text' && !found.object.locked && drag.wasSelected) {
      setEditingId(id)
    }
  }, [])

  const addText = useCallback(
    (preset: { sample: string; size: number; font: FontId; bold?: boolean }) => {
      const pageIndex = selected?.pageIndex ?? 0
      const style = {
        font: preset.font,
        size: preset.size,
        lineHeight: DEFAULT_LH,
        bold: preset.bold,
        color: '#14110e' as const,
        align: 'left' as const,
      }
      const maxW = Math.max(MIN_W, PAGE_W - 48)
      const object: TextObject = {
        id: uid('obj'),
        type: 'text',
        x: 40,
        y: 40,
        w: fittedTextWidth(preset.sample, style, maxW),
        text: preset.sample,
        style,
      }
      edit((draft) => {
        const page = draft.pages[pageIndex]
        const lowest = page.objects.reduce((max, other) => {
          const box = boxOf(other)
          return Math.max(max, other.y + box.h)
        }, 32)
        object.y = Math.min(PAGE_H - 36, page.objects.length ? lowest + 16 : 40)
        page.objects.push(object)
      })
      setSelectedIds([object.id])
      setEditingId(null)
    },
    [PAGE_H, PAGE_W, edit, selected],
  )

  const addShape = useCallback(
    (kind: ShapeKind, fill: string) => {
      const pageIndex = selected?.pageIndex ?? 0
      const w = kind === 'line' ? 220 : 140
      const h = kind === 'line' ? 3 : 140
      const object: CanvasObject = {
        id: uid('obj'),
        type: 'shape',
        kind,
        x: (PAGE_W - w) / 2,
        y: (PAGE_H - h) / 3,
        w,
        h,
        fill,
        radius: kind === 'rect' ? 0 : undefined,
      }
      edit((draft) => {
        draft.pages[pageIndex].objects.push(object)
      })
      setSelectedIds([object.id])
    },
    [PAGE_H, PAGE_W, edit, selected],
  )

  const placeImage = useCallback(
    async (src: string, naturalW?: number, naturalH?: number) => {
      let pxW = naturalW
      let pxH = naturalH
      if (!pxW || !pxH) {
        const image = await loadImage(src)
        pxW = image.naturalWidth
        pxH = image.naturalHeight
      }
      const width = Math.min(240, PAGE_W * 0.45)
      const height = Math.max(24, (width * (pxH || 300)) / (pxW || 300))
      const object: CanvasObject = {
        id: uid('obj'),
        type: 'image',
        x: (PAGE_W - width) / 2,
        y: 48,
        w: width,
        h: height,
        src,
      }
      const replacing = replaceRef.current
      snapshot()
      setDoc((current) => {
        const draft = clone(current)
        const found = findObject(draft, selectedId)
        if (replacing && found && found.object.type === 'image') {
          found.object.src = src
          return draft
        }
        draft.pages[found?.pageIndex ?? 0].objects.push(object)
        return draft
      })
      replaceRef.current = false
      if (!replacing) setSelectedIds([object.id])
      setNotice('Image on the page — drag it, or pull a corner.')
    },
    [PAGE_W, selectedId, snapshot],
  )

  const addImageFile = useCallback(
    async (file: File) => {
      setBusy(true)
      setNotice(null)
      try {
        let src: string
        if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp') {
          src = await readAsDataUrl(file)
        } else {
          const url = URL.createObjectURL(file)
          try {
            const image = await loadImage(url)
            const longest = Math.max(image.naturalWidth, image.naturalHeight) || 1
            const factor = Math.min(1, 1600 / longest)
            const pxW = Math.max(1, Math.round(image.naturalWidth * factor))
            const pxH = Math.max(1, Math.round(image.naturalHeight * factor))
            const scratch = document.createElement('canvas')
            scratch.width = pxW
            scratch.height = pxH
            const context = scratch.getContext('2d')
            if (!context) throw new Error('This browser cannot read images.')
            context.fillStyle = '#ffffff'
            context.fillRect(0, 0, pxW, pxH)
            context.drawImage(image, 0, 0, pxW, pxH)
            src = scratch.toDataURL('image/jpeg', 0.92)
          } finally {
            URL.revokeObjectURL(url)
          }
        }
        await placeImage(src)
      } catch (problem) {
        setNotice(problem instanceof Error ? problem.message : 'Could not add that image.')
      } finally {
        setBusy(false)
      }
    },
    [placeImage],
  )

  useEffect(() => {
    const onStock = (event: Event) => {
      const src = (event as CustomEvent<string>).detail
      void placeImage(src)
    }
    window.addEventListener('folio-stock', onStock)
    return () => window.removeEventListener('folio-stock', onStock)
  }, [placeImage])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      const text = event.clipboardData?.getData('text/plain') ?? ''
      if (text.startsWith('FOLIO_OBJECTS:')) return
      const file = [...(event.clipboardData?.files ?? [])].find((item) => item.type.startsWith('image/'))
      if (!file) return
      event.preventDefault()
      void addImageFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addImageFile])

  const removeObject = useCallback(
    (id: string) => {
      const ids = selectedIdsRef.current.includes(id) ? selectedIdsRef.current : [id]
      edit((draft) => {
        for (const page of draft.pages) {
          page.objects = page.objects.filter((object) => !ids.includes(object.id))
        }
      })
      setSelectedIds((current) => current.filter((item) => !ids.includes(item)))
      if (ids.includes(editingId ?? '')) setEditingId(null)
    },
    [edit, editingId],
  )

  const duplicateObject = useCallback(
    (id: string) => {
      const ids = selectedIdsRef.current.includes(id) ? selectedIdsRef.current : [id]
      const created: string[] = []
      edit((draft) => {
        for (const item of ids) {
          const found = findObject(draft, item)
          if (!found) continue
          const copy = { ...clone(found.object), id: uid('obj'), y: found.object.y + 16, x: found.object.x + 16 }
          draft.pages[found.pageIndex].objects.splice(found.index + 1, 0, copy)
          created.push(copy.id)
        }
      })
      if (created.length) setSelectedIds(created)
    },
    [edit],
  )

  const copySelected = useCallback(() => {
    const objects = selectedIdsRef.current
      .map((id) => findObject(docRef.current, id)?.object)
      .filter(Boolean)
    if (!objects.length) return
    void navigator.clipboard.writeText(`FOLIO_OBJECTS:${JSON.stringify(objects)}`)
    setNotice(`Copied ${objects.length} object${objects.length === 1 ? '' : 's'}.`)
  }, [])

  const pasteObjects = useCallback(
    (raw: string) => {
      if (!raw.startsWith('FOLIO_OBJECTS:')) return false
      try {
        const parsed = JSON.parse(raw.slice('FOLIO_OBJECTS:'.length)) as CanvasObject[]
        if (!Array.isArray(parsed) || !parsed.length) return false
        const pageIndex = selected?.pageIndex ?? 0
        const created: string[] = []
        edit((draft) => {
          const page = draft.pages[pageIndex]
          for (const object of parsed) {
            const copy = { ...clone(object), id: uid('obj'), x: object.x + 16, y: object.y + 16 }
            page.objects.push(copy)
            created.push(copy.id)
          }
        })
        setSelectedIds(created)
        return true
      } catch {
        return false
      }
    },
    [edit, selected],
  )

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      const text = event.clipboardData?.getData('text/plain') ?? ''
      if (!text.startsWith('FOLIO_OBJECTS:')) return
      event.preventDefault()
      pasteObjects(text)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [pasteObjects])

  const flipSelected = useCallback(
    (axis: 'x' | 'y') => {
      const ids = selectedIdsRef.current
      if (!ids.length) return
      edit((draft) => {
        for (const id of ids) {
          const found = findObject(draft, id)
          if (!found) continue
          if (axis === 'x') found.object.flipX = !found.object.flipX
          else found.object.flipY = !found.object.flipY
        }
      })
    },
    [edit],
  )

  const rotateSelected = useCallback(() => {
    const ids = selectedIdsRef.current
    if (!ids.length) return
    edit((draft) => {
      for (const id of ids) {
        const found = findObject(draft, id)
        if (!found) continue
        found.object.rotation = ((found.object.rotation ?? 0) + 90) % 360
      }
    })
  }, [edit])

  const toggleHidden = useCallback(
    (id: string) => {
      edit((draft) => {
        const found = findObject(draft, id)
        if (found) found.object.hidden = !found.object.hidden
      })
    },
    [edit],
  )

  const toggleLockId = useCallback(
    (id: string) => {
      edit((draft) => {
        const found = findObject(draft, id)
        if (found) found.object.locked = !found.object.locked
      })
    },
    [edit],
  )

  const distribute = useCallback(
    (axis: 'x' | 'y') => {
      const ids = selectedIdsRef.current
      if (ids.length < 3) return
      const found = ids
        .map((id) => findObject(docRef.current, id))
        .filter(Boolean) as Array<{ object: CanvasObject }>
      const items = found.map(({ object }) => ({ object, box: boxOf(object) }))
      items.sort((a, b) => (axis === 'x' ? a.object.x - b.object.x : a.object.y - b.object.y))
      const first = items[0]
      const last = items[items.length - 1]
      const start = axis === 'x' ? first.object.x : first.object.y
      const end =
        axis === 'x' ? last.object.x + last.box.w : last.object.y + last.box.h
      const total = items.reduce((sum, item) => sum + (axis === 'x' ? item.box.w : item.box.h), 0)
      const gap = (end - start - total) / (items.length - 1)
      edit((draft) => {
        let cursor = start
        for (const item of items) {
          const target = findObject(draft, item.object.id)
          if (!target) continue
          if (axis === 'x') target.object.x = cursor
          else target.object.y = cursor
          cursor += (axis === 'x' ? item.box.w : item.box.h) + gap
        }
      })
    },
    [edit],
  )

  const moveLayer = useCallback(
    (id: string, direction: -1 | 1) => {
      const found = findObject(docRef.current, id)
      if (!found) return
      edit((draft) => {
        const objects = draft.pages[found.pageIndex].objects
        const target = found.index + direction
        if (target < 0 || target >= objects.length) return
        const [moved] = objects.splice(found.index, 1)
        objects.splice(target, 0, moved)
      })
    },
    [edit],
  )

  const patchSelected = useCallback(
    (patch: Record<string, unknown>) => {
      const found = findObject(docRef.current, selectedId)
      if (!found) return
      edit((draft) => {
        const target = draft.pages[found.pageIndex].objects.find((item) => item.id === found.object.id)
        if (!target) return
        if (typeof patch.x === 'number') target.x = patch.x
        if (typeof patch.y === 'number') target.y = patch.y
        if (typeof patch.opacity === 'number') target.opacity = patch.opacity
        if (typeof patch.w === 'number') {
          if (target.type === 'text') target.w = Math.max(MIN_W, patch.w)
          if (target.type === 'image' || target.type === 'shape') {
            const ratio = target.h / Math.max(1, target.w)
            target.w = Math.max(MIN_W, patch.w)
            if (target.type === 'image') target.h = target.w * ratio
            else if (target.kind !== 'line') target.h = target.w * ratio
          }
        }
        if (target.type === 'text') {
          const style = { ...target.style }
          const keys: Array<keyof TextStyle> = [
            'font',
            'size',
            'lineHeight',
            'bold',
            'italic',
            'underline',
            'color',
            'align',
            'letterSpacing',
          ]
          for (const key of keys) {
            if (key in patch) (style as Record<string, unknown>)[key] = patch[key]
          }
          target.style = style
        }
        if (target.type === 'shape') {
          if (typeof patch.fill === 'string') target.fill = patch.fill
          if (typeof patch.radius === 'number') target.radius = patch.radius
          if (typeof patch.h === 'number') target.h = patch.h
        }
        if (target.type === 'image' && typeof patch.h === 'number') target.h = patch.h
      })
    },
    [edit, selectedId],
  )

  const alignOnPage = useCallback(
    (where: 'left' | 'centre' | 'right' | 'top' | 'middle' | 'bottom') => {
      const found = findObject(docRef.current, selectedId)
      if (!found) return
      const box = boxOf(found.object)
      edit((draft) => {
        const target = draft.pages[found.pageIndex].objects.find((item) => item.id === found.object.id)
        if (!target) return
        if (where === 'left') target.x = 0
        if (where === 'right') target.x = PAGE_W - box.w
        if (where === 'centre') target.x = (PAGE_W - box.w) / 2
        if (where === 'top') target.y = 0
        if (where === 'bottom') target.y = PAGE_H - box.h
        if (where === 'middle') target.y = (PAGE_H - box.h) / 2
      })
    },
    [PAGE_H, PAGE_W, edit, selectedId],
  )

  const addPage = useCallback(() => {
    edit((draft) => {
      draft.pages.push({
        id: uid('page'),
        background: draft.pages[draft.pages.length - 1]?.background ?? '#ffffff',
        objects: [],
      })
    })
  }, [edit])

  const duplicatePage = useCallback(
    (pageIndex: number) => {
      edit((draft) => {
        const page = draft.pages[pageIndex]
        if (!page) return
        draft.pages.splice(pageIndex + 1, 0, {
          id: uid('page'),
          background: page.background,
          objects: page.objects.map((object) => ({ ...clone(object), id: uid('obj') })),
        })
      })
    },
    [edit],
  )

  const removePage = useCallback(
    (pageIndex: number) => {
      if (doc.pages.length <= 1) return
      edit((draft) => {
        draft.pages.splice(pageIndex, 1)
      })
      setSelectedIds([])
      setEditingId(null)
    },
    [doc.pages.length, edit],
  )

  const persist = useCallback(() => {
    saveDoc({ ...doc, updatedAt: Date.now() })
    setSaveState('saved')
    setNotice('Saved on this computer.')
  }, [doc])

  const doExport = useCallback(
    async (kind: 'png' | 'pdf') => {
      setDownloadOpen(false)
      setExporting(true)
      setBusy(true)
      await new Promise((r) => setTimeout(r, 40))
      try {
        const elements = pageRefs.current.filter(Boolean) as HTMLDivElement[]
        if (kind === 'png') {
          const index = selected?.pageIndex ?? 0
          const page = elements[index] ?? elements[0]
          if (page) await downloadPng(page, doc.size, doc.name)
        } else {
          await downloadPdf(elements, doc.size, doc.name)
        }
      } catch (problem) {
        setNotice(problem instanceof Error ? problem.message : 'Export failed.')
      } finally {
        setExporting(false)
        setBusy(false)
      }
    },
    [doc.name, doc.size, selected],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey
      const target = event.target as HTMLElement | null
      const typing = Boolean(target?.isContentEditable) || target?.tagName === 'INPUT' || target?.tagName === 'SELECT'
      const key = event.key.toLowerCase()
      if (meta && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (meta && key === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (meta && key === 's') {
        event.preventDefault()
        persist()
        return
      }
      if (typing) return
      if (event.code === 'Space') {
        spaceRef.current = true
        return
      }
      if (key === 't') {
        addText({ sample: 'Heading', size: 28, font: 'playfair' })
        return
      }
      if (key === 'r') {
        addShape('rect', '#14110e')
        return
      }
      if (key === 'o') {
        addShape('ellipse', '#c45d32')
        return
      }
      if (key === 'l') {
        addShape('line', '#14110e')
        return
      }
      if (key === 'g') {
        setGridOn((value) => !value)
        return
      }
      if (key === 'p') {
        setPreview(true)
        return
      }
      if (key === 'm') {
        setMarginsOn((value) => !value)
        return
      }
      if (meta && key === 'a') {
        event.preventDefault()
        const pageIndex = selected?.pageIndex ?? 0
        setSelectedIds(
          docRef.current.pages[pageIndex].objects.filter((object) => !object.hidden).map((object) => object.id),
        )
        return
      }
      if (meta && key === 'c' && selectedId) {
        event.preventDefault()
        copySelected()
        return
      }
      if (meta && key === 'd' && selectedId) {
        event.preventDefault()
        duplicateObject(selectedId)
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault()
        removeObject(selectedId)
        return
      }
      if (event.key === 'Escape') {
        setMenu(null)
        if (editingId) setEditingId(null)
        else if (selectedId) setSelectedIds([])
        return
      }
      if (!selectedId) return
      const step = event.shiftKey ? 10 : 1
      const nudges: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      const nudge = nudges[event.key]
      if (!nudge) return
      event.preventDefault()
      snapshot()
      live((draft) => {
        for (const id of selectedIdsRef.current) {
          const found = findObject(draft, id)
          if (!found || found.object.locked) continue
          found.object.x += nudge[0]
          found.object.y += nudge[1]
        }
      })
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') spaceRef.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [
    addShape,
    addText,
    copySelected,
    duplicateObject,
    editingId,
    live,
    persist,
    redo,
    removeObject,
    selected,
    selectedId,
    snapshot,
    undo,
  ])

  const selectedBox = selected ? boxOf(selected.object) : null
  const selectedText =
    selected && selected.object.type === 'text' ? (selected.object as TextObject) : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#d9cfc0]">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-ink/10 bg-[#fbf8f2] px-2 sm:gap-3 sm:px-3">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              saveDoc(doc)
              onBack(doc)
            }}
            className="flex h-9 items-center gap-1 rounded-full px-2 text-sm text-stone hover:bg-ink/5 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone hover:bg-ink/5 md:hidden"
            onClick={() => setToolsOpen(true)}
            title="Tools"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="font-display text-lg tracking-tight">Folio</div>
          <input
            value={doc.name}
            onChange={(event) => setDoc((current) => ({ ...current, name: event.target.value }))}
            className="min-w-0 max-w-27.5 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none hover:border-ink/10 focus:border-ink/20 sm:max-w-60"
          />
          <span className="hidden rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-stone md:inline">
            {doc.size.name} · {doc.pages.length} page{doc.pages.length === 1 ? '' : 's'}
          </span>
          <span className="hidden rounded-full px-2 py-0.5 text-[11px] sm:inline">
            {saveState === 'saving' ? (
              <span className="text-stone">Saving…</span>
            ) : (
              <span className="text-forest">Saved on this computer</span>
            )}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
          <IconBtn title="Undo" onClick={undo} disabled={!past.length}>
            <Undo2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Redo" onClick={redo} disabled={!future.length}>
            <Redo2 className="h-4 w-4" />
          </IconBtn>
          <span className="mx-1 h-5 w-px bg-ink/10" />
          <IconBtn
            title="Zoom out"
            onClick={() => {
              setFit(false)
              setZoom((v) => Math.max(ZOOM_MIN, Math.round((v - 0.1) * 100) / 100))
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </IconBtn>
          <span className="w-12 text-center text-xs tabular-nums text-stone">{Math.round(zoom * 100)}%</span>
          <IconBtn
            title="Zoom in"
            onClick={() => {
              setFit(false)
              setZoom((v) => Math.min(ZOOM_MAX, Math.round((v + 0.1) * 100) / 100))
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Fit" onClick={() => setFit((v) => !v)}>
            <Maximize className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Grid (G)" onClick={() => setGridOn((v) => !v)}>
            <Grid3x3 className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Preview (P)" onClick={() => setPreview(true)}>
            <Play className="h-4 w-4" />
          </IconBtn>
          <span className="mx-1 h-5 w-px bg-ink/10" />
          <button
            type="button"
            onClick={persist}
            className="hidden h-9 items-center gap-1 rounded-full border border-ink/10 px-3 text-sm sm:flex"
          >
            <Check className="h-4 w-4" />
            Save
          </button>
          <div className="relative">
            <button
              type="button"
              disabled={busy}
              onClick={() => setDownloadOpen((v) => !v)}
              className="flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-sm text-paper"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            {downloadOpen ? (
              <div className="absolute right-0 z-40 mt-1 w-40 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-ink/5"
                  onClick={() => void doExport('pdf')}
                >
                  PDF · all pages
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-ink/5"
                  onClick={() => void doExport('png')}
                >
                  PNG · this page
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-ink/5"
                  onClick={() => {
                    setDownloadOpen(false)
                    downloadJson(doc, doc.name)
                  }}
                >
                  JSON · editable file
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-ink/5"
                  onClick={() => {
                    setDownloadOpen(false)
                    jsonRef.current?.click()
                  }}
                >
                  Import JSON
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden h-full md:flex">
          <Sidebar
            panel={panel}
            onPanel={setPanel}
            onAddText={addText}
            onAddShape={addShape}
            onUpload={() => {
              replaceRef.current = false
              fileRef.current?.click()
            }}
            onBackground={(color) => {
              const pageIndex = selected?.pageIndex ?? 0
              edit((draft) => {
                draft.pages[pageIndex].background = color
              })
            }}
            onInsertTemplatePage={(templateId) => {
              const template = TEMPLATES.find((item) => item.id === templateId)
              if (!template) return
              const made = instantiateTemplate(template)
              edit((draft) => {
                const page: Page = made.pages[0]
                draft.pages.push(page)
              })
              setNotice(`Added a page from “${template.name}”.`)
            }}
          />
        </div>

        {toolsOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              aria-label="Close tools"
              onClick={() => setToolsOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 h-full shadow-2xl">
              <Sidebar
                panel={panel}
                onPanel={setPanel}
                onAddText={(preset) => {
                  addText(preset)
                  setToolsOpen(false)
                }}
                onAddShape={(kind, fill) => {
                  addShape(kind, fill)
                  setToolsOpen(false)
                }}
                onUpload={() => {
                  replaceRef.current = false
                  fileRef.current?.click()
                  setToolsOpen(false)
                }}
                onBackground={(color) => {
                  const pageIndex = selected?.pageIndex ?? 0
                  edit((draft) => {
                    draft.pages[pageIndex].background = color
                  })
                }}
                onInsertTemplatePage={(templateId) => {
                  const template = TEMPLATES.find((item) => item.id === templateId)
                  if (!template) return
                  const made = instantiateTemplate(template)
                  edit((draft) => {
                    const page: Page = made.pages[0]
                    draft.pages.push(page)
                  })
                  setNotice(`Added a page from “${template.name}”.`)
                  setToolsOpen(false)
                }}
              />
            </div>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          className="relative min-w-0 flex-1 overflow-auto p-3 pb-28 sm:p-6 sm:pb-16 lg:p-8"
          onPointerMove={(event) => {
            if (selected) {
              const point = pointInPage(event.clientX, event.clientY, selected.pageIndex)
              setCursor({ x: Math.round(point.x), y: Math.round(point.y) })
            }
            if (!panRef.current || !spaceRef.current) return
            const node = scrollRef.current
            if (!node) return
            node.scrollLeft = panRef.current.sl - (event.clientX - panRef.current.x)
            node.scrollTop = panRef.current.st - (event.clientY - panRef.current.y)
          }}
          onPointerDown={(event) => {
            if (!spaceRef.current) return
            const node = scrollRef.current
            if (!node) return
            panRef.current = {
              x: event.clientX,
              y: event.clientY,
              sl: node.scrollLeft,
              st: node.scrollTop,
            }
          }}
          onPointerUp={() => {
            panRef.current = null
          }}
        >
          {notice ? (
            <div className="pointer-events-none sticky top-0 z-30 mx-auto mb-3 w-fit rounded-full bg-ink/90 px-3 py-1 text-[11px] font-medium text-paper">
              {notice}
            </div>
          ) : null}

          {doc.pages.map((page, pageIndex) => (
            <div
              key={page.id}
              className="relative mx-auto"
              style={{
                width: PAGE_W * zoom,
                height: PAGE_H * zoom,
                marginBottom: PAGE_GAP * zoom,
              }}
            >
              <div
                ref={(el) => {
                  pageRefs.current[pageIndex] = el
                }}
                className={
                  exporting
                    ? 'folio-page absolute left-0 top-0 overflow-hidden shadow-[0_12px_40px_rgba(20,17,14,0.18)] ring-1 ring-black/10'
                    : 'folio-page absolute left-0 top-0 overflow-visible shadow-[0_12px_40px_rgba(20,17,14,0.18)] ring-1 ring-black/10'
                }
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  background: page.background,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
                onPointerDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  setEditingId(null)
                  setMenu(null)
                  const point = pointInPage(event.clientX, event.clientY, pageIndex)
                  setMarquee({ pageIndex, x0: point.x, y0: point.y, x1: point.x, y1: point.y })
                  try {
                    event.currentTarget.setPointerCapture(event.pointerId)
                  } catch {
                    /* optional */
                  }
                }}
                onPointerMove={(event) => {
                  if (!marquee || marquee.pageIndex !== pageIndex) return
                  const point = pointInPage(event.clientX, event.clientY, pageIndex)
                  setMarquee({ ...marquee, x1: point.x, y1: point.y })
                }}
                onPointerUp={() => {
                  if (!marquee || marquee.pageIndex !== pageIndex) return
                  const x = Math.min(marquee.x0, marquee.x1)
                  const y = Math.min(marquee.y0, marquee.y1)
                  const w = Math.abs(marquee.x1 - marquee.x0)
                  const h = Math.abs(marquee.y1 - marquee.y0)
                  setMarquee(null)
                  if (w < 4 && h < 4) {
                    setSelectedIds([])
                    return
                  }
                  const hits = page.objects
                    .filter((object) => !object.hidden)
                    .filter((object) => {
                      const box = boxOf(object)
                      return rectsOverlap({ x, y, w, h }, { x: object.x, y: object.y, w: box.w, h: box.h })
                    })
                    .map((object) => object.id)
                  setSelectedIds(hits)
                }}
              >
                {gridOn && !exporting ? (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(20,17,14,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,17,14,0.12) 1px, transparent 1px)',
                      backgroundSize: `${GRID}px ${GRID}px`,
                    }}
                  />
                ) : null}
                {marginsOn && !exporting ? (
                  <div
                    className="pointer-events-none absolute border border-dashed border-black/20"
                    style={{ left: 36, top: 36, width: PAGE_W - 72, height: PAGE_H - 72 }}
                  />
                ) : null}
                {marquee && marquee.pageIndex === pageIndex ? (
                  <div
                    className="pointer-events-none absolute border border-clay bg-clay/10"
                    style={{
                      left: Math.min(marquee.x0, marquee.x1),
                      top: Math.min(marquee.y0, marquee.y1),
                      width: Math.abs(marquee.x1 - marquee.x0),
                      height: Math.abs(marquee.y1 - marquee.y0),
                    }}
                  />
                ) : null}
                {!exporting
                  ? guides.x.map((x) => (
                      <div
                        key={`gx-${x}`}
                        className="pointer-events-none absolute top-0 w-px bg-clay"
                        style={{ left: x, height: PAGE_H }}
                      />
                    ))
                  : null}
                {!exporting
                  ? guides.y.map((y) => (
                      <div
                        key={`gy-${y}`}
                        className="pointer-events-none absolute left-0 h-px bg-clay"
                        style={{ top: y, width: PAGE_W }}
                      />
                    ))
                  : null}

                {page.objects.map((object) => {
                  if (object.hidden) return null
                  const box = boxOf(object)
                  const isSelected = selectedIds.includes(object.id) && !exporting
                  const isEditing = object.id === editingId
                  const transform = [
                    object.flipX ? 'scaleX(-1)' : '',
                    object.flipY ? 'scaleY(-1)' : '',
                    object.rotation ? `rotate(${object.rotation}deg)` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <div
                      key={object.id}
                      className={cn(
                        'absolute',
                        isEditing ? 'cursor-text' : object.locked ? 'cursor-default' : 'cursor-move',
                        isSelected && !isEditing ? 'outline-1 outline-clay' : '',
                      )}
                      style={{
                        left: object.x,
                        top: object.y,
                        width: Math.max(4, box.w),
                        height: Math.max(4, box.h),
                        transform: transform || undefined,
                      }}
                      onPointerDown={(event) => {
                        if (object.hidden) return
                        const inGroup = selectedIds.includes(object.id) && selectedIds.length > 1
                        let nextIds = selectedIds
                        if (event.shiftKey) {
                          nextIds = selectedIds.includes(object.id)
                            ? selectedIds.filter((id) => id !== object.id)
                            : [...selectedIds, object.id]
                          setSelectedIds(nextIds)
                        } else if (!inGroup) {
                          nextIds = [object.id]
                          setSelectedIds([object.id])
                        }
                        const already = selectedIds.includes(object.id)
                        startMove(event, pageIndex, object, already, nextIds)
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault()
                        setSelectedIds((ids) => (ids.includes(object.id) ? ids : [object.id]))
                        setMenu({ x: event.clientX, y: event.clientY, id: object.id })
                      }}
                      onPointerMove={onPointerMove}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      onDoubleClick={(event) => {
                        event.stopPropagation()
                        if (object.type === 'text' && !object.locked) {
                          snapshot()
                          setEditingId(object.id)
                          setSelectedIds([object.id])
                        }
                      }}
                    >
                      {object.type === 'text' ? (
                        <EditableText
                          key={object.id}
                          active={isEditing}
                          value={object.text}
                          placeholder={isSelected ? 'Type here…' : ''}
                          onChange={(text) => {
                            setDoc((current) => {
                              const draft = clone(current)
                              const found = findObject(draft, object.id)
                              if (found && found.object.type === 'text') {
                                found.object.text = text
                                if (!text.includes('\n')) {
                                  const maxW = PAGE_W - found.object.x - 16
                                  found.object.w = Math.max(
                                    found.object.w,
                                    fittedTextWidth(text, found.object.style, maxW),
                                  )
                                }
                              }
                              return draft
                            })
                          }}
                          onDone={() => setEditingId(null)}
                          style={{
                            fontFamily: fontStack(object.style.font),
                            fontSize: object.style.size,
                            lineHeight: object.style.lineHeight,
                            fontWeight: object.style.bold ? 700 : 500,
                            fontStyle: object.style.italic ? 'italic' : 'normal',
                            textDecoration: object.style.underline ? 'underline' : 'none',
                            color: object.style.color,
                            textAlign: object.style.align,
                            letterSpacing: object.style.letterSpacing,
                            opacity: object.opacity ?? 1,
                          }}
                        />
                      ) : (
                        <ObjectVisual object={object} />
                      )}
                    </div>
                  )
                })}

                {selected && selected.pageIndex === pageIndex && !editingId && selectedBox && !exporting ? (
                  <>
                    <div
                      className="pointer-events-none absolute border border-clay"
                      style={{
                        left: selected.object.x - 1,
                        top: selected.object.y - 1,
                        width: selectedBox.w + 2,
                        height: selectedBox.h + 2,
                      }}
                    />
                    {HANDLES.map((handle) => {
                      const size = 9 / zoom
                      const left =
                        selected.object.x +
                        (handle.includes('w') ? 0 : handle.includes('e') ? selectedBox.w : selectedBox.w / 2)
                      const top =
                        selected.object.y +
                        (handle.includes('n') ? 0 : handle.includes('s') ? selectedBox.h : selectedBox.h / 2)
                      return (
                        <div
                          key={handle}
                          className="absolute rounded-xs border border-clay bg-white shadow-sm"
                          style={{
                            left: left - size / 2,
                            top: top - size / 2,
                            width: size,
                            height: size,
                            cursor: HANDLE_CURSORS[handle],
                          }}
                          onPointerDown={(event) => startResize(event, pageIndex, selected.object, handle)}
                          onPointerMove={onPointerMove}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                        />
                      )
                    })}
                  </>
                ) : null}
              </div>

              <div
                className="absolute left-0 flex w-full items-center justify-between text-[11px] text-stone"
                style={{ top: PAGE_H * zoom + 8 }}
              >
                <span>
                  Page {pageIndex + 1} of {doc.pages.length}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" className="hover:text-ink" onClick={() => duplicatePage(pageIndex)}>
                    Duplicate page
                  </button>
                  {doc.pages.length > 1 ? (
                    <button type="button" className="hover:text-red-700" onClick={() => removePage(pageIndex)}>
                      Remove page
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center pb-16">
            <button
              type="button"
              onClick={addPage}
              className="flex items-center gap-1 rounded-full border border-ink/15 bg-[#fbf8f2] px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add page
            </button>
          </div>
        </div>

        {menu ? (
        <button type="button" className="fixed inset-0 z-65" aria-label="Close menu" onClick={() => setMenu(null)} />
      ) : null}
      {selected && !editingId && selectedBox && !exporting && selectedIds.length <= 1 ? (
          <FloatingBar
            pageEl={pageRefs.current[selected.pageIndex] ?? null}
            x={selected.object.x}
            y={selected.object.y}
            w={selectedBox.w}
            h={selectedBox.h}
            zoom={zoom}
          >
            {selectedText ? (
              <>
                <select
                  className="h-8 max-w-27.5 rounded-md border border-ink/10 bg-white px-1 text-xs"
                  value={selectedText.style.font}
                  onChange={(event) => patchSelected({ font: event.target.value })}
                >
                  {FONT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="h-8 rounded-md border border-ink/10 bg-white px-1 text-xs"
                  value={String(selectedText.style.size)}
                  onChange={(event) => patchSelected({ size: Number(event.target.value) })}
                >
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <Mini
                  on={Boolean(selectedText.style.bold)}
                  title="Bold"
                  onClick={() => patchSelected({ bold: !selectedText.style.bold })}
                >
                  <Bold className="h-4 w-4" />
                </Mini>
                <Mini
                  on={Boolean(selectedText.style.italic)}
                  title="Italic"
                  onClick={() => patchSelected({ italic: !selectedText.style.italic })}
                >
                  <Italic className="h-4 w-4" />
                </Mini>
                <Mini
                  on={Boolean(selectedText.style.underline)}
                  title="Underline"
                  onClick={() => patchSelected({ underline: !selectedText.style.underline })}
                >
                  <Underline className="h-4 w-4" />
                </Mini>
                {TEXT_COLORS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => patchSelected({ color })}
                    className={cn(
                      'h-5 w-5 rounded-full border',
                      selectedText.style.color === color ? 'border-clay' : 'border-ink/15',
                    )}
                    style={{ background: color }}
                  />
                ))}
              </>
            ) : null}
            {selected.object.type === 'image' ? (
              <button
                type="button"
                className="h-8 rounded-md border border-ink/10 px-2 text-xs"
                onClick={() => {
                  replaceRef.current = true
                  fileRef.current?.click()
                }}
              >
                Swap
              </button>
            ) : null}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-stone hover:bg-ink/5"
              onClick={() => duplicateObject(selected.object.id)}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-stone hover:bg-ink/5"
              onClick={() => moveLayer(selected.object.id, 1)}
              title="Bring forward"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-stone hover:bg-ink/5"
              onClick={() => moveLayer(selected.object.id, -1)}
              title="Send backward"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-stone hover:bg-red-50 hover:text-red-700"
              onClick={() => removeObject(selected.object.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </FloatingBar>
        ) : null}

        <Inspector
          object={selected?.object ?? null}
          objects={doc.pages[selected?.pageIndex ?? 0]?.objects ?? []}
          selectedIds={selectedIds}
          pageW={PAGE_W}
          pageH={PAGE_H}
          onPatch={patchSelected}
          onAlign={alignOnPage}
          onDistribute={distribute}
          onLock={() => {
            if (!selected) return
            toggleLockId(selected.object.id)
          }}
          onSelectLayer={(id, additive) => {
            setSelectedIds((ids) => {
              if (additive) return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
              return [id]
            })
          }}
          onToggleHidden={toggleHidden}
          onToggleLock={toggleLockId}
          onFlip={flipSelected}
          onRotate={rotateSelected}
        />
      </div>

      <div className="hidden h-10 shrink-0 items-center justify-between border-t border-ink/10 bg-[#fbf8f2] px-3 text-[11px] text-stone sm:flex">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={gridOn} onChange={() => setGridOn((v) => !v)} />
            Grid
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={gridSnap} onChange={() => setGridSnap((v) => !v)} />
            Snap
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={marginsOn} onChange={() => setMarginsOn((v) => !v)} />
            Margins
          </label>
          <span>
            x {cursor.x} · y {cursor.y}
          </span>
          {selectedIds.length > 1 ? <span>{selectedIds.length} selected</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.05}
            value={zoom}
            onChange={(event) => {
              setFit(false)
              setZoom(Number(event.target.value))
            }}
          />
          <span className="w-10 tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {preview ? (
        <PreviewMode doc={doc} startPage={selected?.pageIndex ?? 0} onClose={() => setPreview(false)} />
      ) : null}

      {menu ? (
        <div
          className="fixed z-70 min-w-40 rounded-xl border border-ink/10 bg-[#fbf8f2] py-1 text-sm shadow-xl"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-ink/5" onClick={() => { duplicateObject(menu.id); setMenu(null) }}>
            Duplicate
          </button>
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-ink/5" onClick={() => { copySelected(); setMenu(null) }}>
            Copy
          </button>
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-ink/5" onClick={() => { toggleLockId(menu.id); setMenu(null) }}>
            Lock / unlock
          </button>
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-ink/5" onClick={() => { toggleHidden(menu.id); setMenu(null) }}>
            Hide
          </button>
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-ink/5" onClick={() => { rotateSelected(); setMenu(null) }}>
            Rotate 90°
          </button>
          <button type="button" className="block w-full px-3 py-1.5 text-left text-red-700 hover:bg-red-50" onClick={() => { removeObject(menu.id); setMenu(null) }}>
            Delete
          </button>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-[#fbf8f2]/95 backdrop-blur sm:hidden">
        <div className="flex gap-2 px-2 py-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
          <button
            type="button"
            className="h-10 flex-1 rounded-xl border border-ink/10 text-sm"
            onClick={() => addText({ sample: 'New text', size: 18, font: 'dm' })}
          >
            Text
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-ink/10 text-sm"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            Image
          </button>
          <button type="button" className="h-10 flex-1 rounded-xl bg-ink text-sm text-paper" onClick={persist}>
            Save
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void addImageFile(file)
        }}
      />
      <input
        ref={jsonRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          void file.text().then((text) => {
            try {
              const parsed = JSON.parse(text) as FolioDoc
              if (!parsed?.pages || !parsed.size) throw new Error('Not a Folio file')
              setDoc({ ...parsed, id: parsed.id || uid('doc'), updatedAt: Date.now() })
              setNotice('JSON imported.')
            } catch (problem) {
              setNotice(problem instanceof Error ? problem.message : 'Could not import that file.')
            }
          })
        }}
      />
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-stone hover:bg-ink/5 hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function Mini({
  children,
  on,
  onClick,
  title,
}: {
  children: ReactNode
  on: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md border',
        on ? 'border-clay bg-clay/10 text-clay' : 'border-transparent text-stone hover:bg-ink/5',
      )}
    >
      {children}
    </button>
  )
}
