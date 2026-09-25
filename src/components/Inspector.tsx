import type { ReactNode } from 'react'
import { AlignCenter, AlignLeft, AlignRight, FlipHorizontal, FlipVertical, Lock, RotateCw, Unlock } from 'lucide-react'
import type { CanvasObject, ShapeObject, TextObject } from '../types'
import { boxOf } from '../lib/geometry'
import { FONT_OPTIONS, SIZE_OPTIONS, TEXT_COLORS, FILL_COLORS } from '../lib/fonts'
import { cn } from '../lib/cn'
import { LayersPanel } from './LayersPanel'

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClass =
  'h-8 w-full rounded-lg border border-ink/10 bg-white px-2 text-xs text-ink outline-none focus:border-clay'

export function Inspector({
  object,
  objects,
  selectedIds,
  pageW,
  pageH,
  onPatch,
  onAlign,
  onDistribute,
  onLock,
  onSelectLayer,
  onToggleHidden,
  onToggleLock,
  onFlip,
  onRotate,
}: {
  object: CanvasObject | null
  objects: CanvasObject[]
  selectedIds: string[]
  pageW: number
  pageH: number
  onPatch: (patch: Record<string, unknown>) => void
  onAlign: (where: 'left' | 'centre' | 'right' | 'top' | 'middle' | 'bottom') => void
  onDistribute: (axis: 'x' | 'y') => void
  onLock: () => void
  onSelectLayer: (id: string, additive: boolean) => void
  onToggleHidden: (id: string) => void
  onToggleLock: (id: string) => void
  onFlip: (axis: 'x' | 'y') => void
  onRotate: () => void
}) {
  const layers = (
    <LayersPanel
      objects={objects}
      selectedIds={selectedIds}
      onSelect={onSelectLayer}
      onToggleHidden={onToggleHidden}
      onToggleLock={onToggleLock}
    />
  )

  if (!object) {
    return (
      <aside className="scrollbar-thin hidden h-full w-72 shrink-0 overflow-y-auto border-l border-ink/10 bg-[#fbf8f2] p-4 lg:block">
        <h3 className="font-display text-lg">Nothing selected</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          Click a line, shape or image. Shift-click or drag a box to select many. Click a selected
          heading again to type.
        </p>
        <ul className="mt-6 space-y-2 text-xs text-stone">
          <li>
            <kbd className="rounded border border-ink/15 bg-white px-1">V</kbd> select ·{' '}
            <kbd className="rounded border border-ink/15 bg-white px-1">T</kbd> text ·{' '}
            <kbd className="rounded border border-ink/15 bg-white px-1">R</kbd> rectangle
          </li>
          <li>
            <kbd className="rounded border border-ink/15 bg-white px-1">⌘S</kbd> save ·{' '}
            <kbd className="rounded border border-ink/15 bg-white px-1">⌘C</kbd> copy
          </li>
          <li>
            <kbd className="rounded border border-ink/15 bg-white px-1">G</kbd> grid ·{' '}
            <kbd className="rounded border border-ink/15 bg-white px-1">P</kbd> preview
          </li>
          <li>Arrows nudge · Shift for 10pt · Ctrl-scroll zoom</li>
        </ul>
        <div className="mt-6">{layers}</div>
      </aside>
    )
  }

  const box = boxOf(object)
  const text = object.type === 'text' ? (object as TextObject) : null
  const shape = object.type === 'shape' ? (object as ShapeObject) : null
  const outside =
    object.x < -1 || object.y < -1 || object.x + box.w > pageW + 1 || object.y + box.h > pageH + 1

  return (
    <aside className="scrollbar-thin hidden h-full w-72 shrink-0 overflow-y-auto border-l border-ink/10 bg-[#fbf8f2] p-4 lg:block">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg capitalize">{object.type === 'shape' ? object.kind : object.type}</h3>
          <p className="text-xs text-stone">
            {Math.round(box.w)} × {Math.round(box.h)} pt
          </p>
        </div>
        <button
          type="button"
          onClick={onLock}
          className="rounded-lg border border-ink/10 bg-white p-2 text-stone hover:text-ink"
          title={object.locked ? 'Unlock' : 'Lock'}
        >
          {object.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
      </div>

      {outside ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-800">
          Hanging off the page — most printers will crop this.
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(
          [
            { key: 'x', label: 'X', value: Math.round(object.x) },
            { key: 'y', label: 'Y', value: Math.round(object.y) },
            { key: 'w', label: 'W', value: Math.round(box.w) },
          ] as const
        ).map((field) => (
          <Field key={field.key} label={field.label}>
            <input
              type="number"
              className={inputClass}
              value={field.value}
              onChange={(event) => onPatch({ [field.key]: Number(event.target.value) })}
            />
          </Field>
        ))}
        <Field label="H">
          <div className="flex h-8 items-center rounded-lg border border-dashed border-ink/15 px-2 text-xs text-stone">
            {Math.round(box.h)}
            {text ? ' auto' : ''}
          </div>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Opacity">
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={object.opacity ?? 1}
            onChange={(event) => onPatch({ opacity: Number(event.target.value) })}
            className="w-full"
          />
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone">Fit on the page</p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {(
            [
              ['left', 'Left'],
              ['centre', 'Centre'],
              ['right', 'Right'],
              ['top', 'Top'],
              ['middle', 'Middle'],
              ['bottom', 'Bottom'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onAlign(id)}
              className="h-8 rounded-lg border border-ink/10 bg-white text-[11px] hover:border-clay"
            >
              {label}
            </button>
          ))}
        </div>
        {selectedIds.length > 2 ? (
          <div className="mt-2 grid grid-cols-2 gap-1">
            <button
              type="button"
              className="h-8 rounded-lg border border-ink/10 bg-white text-[11px] hover:border-clay"
              onClick={() => onDistribute('x')}
            >
              Space H
            </button>
            <button
              type="button"
              className="h-8 rounded-lg border border-ink/10 bg-white text-[11px] hover:border-clay"
              onClick={() => onDistribute('y')}
            >
              Space V
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-1">
        <button
          type="button"
          className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-ink/10 bg-white text-[11px]"
          onClick={onRotate}
          title="Rotate 90°"
        >
          <RotateCw className="h-3.5 w-3.5" />
          90°
        </button>
        <button
          type="button"
          className="flex h-8 flex-1 items-center justify-center rounded-lg border border-ink/10 bg-white"
          onClick={() => onFlip('x')}
          title="Flip horizontal"
        >
          <FlipHorizontal className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-8 flex-1 items-center justify-center rounded-lg border border-ink/10 bg-white"
          onClick={() => onFlip('y')}
          title="Flip vertical"
        >
          <FlipVertical className="h-4 w-4" />
        </button>
      </div>

      {text ? (
        <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
          <Field label="Typeface">
            <select
              className={inputClass}
              value={text.style.font}
              onChange={(event) => onPatch({ font: event.target.value })}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size">
            <select
              className={inputClass}
              value={String(text.style.size)}
              onChange={(event) => onPatch({ size: Number(event.target.value) })}
            >
              {SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} pt
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => {
              const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight
              return (
                <button
                  key={align}
                  type="button"
                  onClick={() => onPatch({ align })}
                  className={cn(
                    'flex h-8 flex-1 items-center justify-center rounded-lg border',
                    text.style.align === align
                      ? 'border-clay bg-clay/10 text-clay'
                      : 'border-ink/10 bg-white text-stone',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onPatch({ color })}
                className={cn(
                  'h-6 w-6 rounded-full border-2',
                  text.style.color === color ? 'border-clay' : 'border-ink/10',
                )}
                style={{ background: color }}
              />
            ))}
            <input
              type="color"
              value={text.style.color}
              onChange={(event) => onPatch({ color: event.target.value })}
              className="h-6 w-6 cursor-pointer rounded-full"
            />
          </div>
          <Field label={`Line height ${text.style.lineHeight.toFixed(2)}`}>
            <input
              type="range"
              min={0.9}
              max={2.2}
              step={0.05}
              value={text.style.lineHeight}
              onChange={(event) => onPatch({ lineHeight: Number(event.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label={`Tracking ${Math.round(text.style.letterSpacing ?? 0)}`}>
            <input
              type="range"
              min={-2}
              max={12}
              step={0.5}
              value={text.style.letterSpacing ?? 0}
              onChange={(event) => onPatch({ letterSpacing: Number(event.target.value) })}
              className="w-full"
            />
          </Field>
        </div>
      ) : null}

      {shape ? (
        <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
          <Field label="Fill">
            <div className="flex flex-wrap gap-1.5">
              {FILL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onPatch({ fill: color })}
                  className={cn(
                    'h-6 w-6 rounded-full border-2',
                    shape.fill === color ? 'border-clay' : 'border-ink/10',
                  )}
                  style={{ background: color }}
                />
              ))}
              <input
                type="color"
                value={shape.fill.startsWith('#') ? shape.fill : '#14110e'}
                onChange={(event) => onPatch({ fill: event.target.value })}
                className="h-6 w-6 cursor-pointer"
              />
            </div>
          </Field>
          {shape.kind === 'rect' ? (
            <Field label="Corner">
              <input
                type="range"
                min={0}
                max={80}
                value={shape.radius ?? 0}
                onChange={(event) => onPatch({ radius: Number(event.target.value) })}
                className="w-full"
              />
            </Field>
          ) : null}
        </div>
      ) : null}

      {object.type === 'image' ? (
        <p className="mt-5 text-xs leading-relaxed text-stone">
          Corners keep the crop. Use Swap in the floating bar to replace the file. Flip and rotate
          from the buttons above.
        </p>
      ) : null}

      <div className="mt-6">{layers}</div>
    </aside>
  )
}
