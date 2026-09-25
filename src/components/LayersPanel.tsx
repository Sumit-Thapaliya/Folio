import { Eye, EyeOff, Lock, Unlock, Square, Type, Image as ImageIcon } from 'lucide-react'
import type { CanvasObject } from '../types'
import { cn } from '../lib/cn'

function labelOf(object: CanvasObject): string {
  if (object.name) return object.name
  if (object.type === 'text') return object.text.trim().slice(0, 28) || 'Text'
  if (object.type === 'image') return 'Image'
  return object.kind
}

function Icon({ object }: { object: CanvasObject }) {
  if (object.type === 'text') return <Type className="h-3.5 w-3.5" />
  if (object.type === 'image') return <ImageIcon className="h-3.5 w-3.5" />
  return <Square className="h-3.5 w-3.5" />
}

export function LayersPanel({
  objects,
  selectedIds,
  onSelect,
  onToggleHidden,
  onToggleLock,
}: {
  objects: CanvasObject[]
  selectedIds: string[]
  onSelect: (id: string, additive: boolean) => void
  onToggleHidden: (id: string) => void
  onToggleLock: (id: string) => void
}) {
  const list = [...objects].reverse()
  return (
    <div className="border-t border-ink/10 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone">Layers</p>
      {list.length === 0 ? (
        <p className="mt-2 text-xs text-stone">Nothing on this page yet.</p>
      ) : (
        <ul className="mt-2 space-y-0.5">
          {list.map((object) => {
            const on = selectedIds.includes(object.id)
            return (
              <li key={object.id}>
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-1 py-1 text-xs',
                    on ? 'bg-clay/10 text-ink' : 'text-stone hover:bg-ink/5',
                    object.hidden ? 'opacity-50' : '',
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left"
                    onClick={(event) => onSelect(object.id, event.shiftKey)}
                  >
                    <Icon object={object} />
                    <span className="truncate">{labelOf(object)}</span>
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-white"
                    title={object.hidden ? 'Show' : 'Hide'}
                    onClick={() => onToggleHidden(object.id)}
                  >
                    {object.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-white"
                    title={object.locked ? 'Unlock' : 'Lock'}
                    onClick={() => onToggleLock(object.id)}
                  >
                    {object.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
