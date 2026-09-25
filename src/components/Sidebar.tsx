import {
  ImagePlus,
  Square,
  Circle,
  Triangle,
  Star,
  Minus,
  Type,
  Shapes,
  Palette,
  Upload,
  LayoutTemplate,
} from 'lucide-react'
import { TEMPLATES, PALETTES } from '../lib/templates'
import { FILL_COLORS } from '../lib/fonts'
import { cn } from '../lib/cn'
import type { FontId, ShapeKind } from '../types'

export type PanelId = 'text' | 'elements' | 'uploads' | 'brand'

const TABS: Array<{ id: PanelId; label: string; icon: typeof Type }> = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'brand', label: 'Brand', icon: Palette },
]

const TEXT_PRESETS: Array<{
  label: string
  sample: string
  size: number
  font: FontId
  bold?: boolean
}> = [
  { label: 'Display', sample: 'A heading with weight', size: 36, font: 'playfair' },
  { label: 'Title', sample: 'Section title', size: 22, font: 'fraunces' },
  { label: 'Subheading', sample: 'A quieter line', size: 16, font: 'grotesk', bold: true },
  { label: 'Body', sample: 'Write the thing itself.', size: 12, font: 'baskerville' },
  { label: 'Caption', sample: 'SMALL LABEL', size: 10, font: 'grotesk', bold: true },
  { label: 'Quote', sample: '“A page is a room.”', size: 20, font: 'cormorant' },
]

const SHAPES: Array<{ kind: ShapeKind; label: string; icon: typeof Square }> = [
  { kind: 'rect', label: 'Rectangle', icon: Square },
  { kind: 'ellipse', label: 'Ellipse', icon: Circle },
  { kind: 'triangle', label: 'Triangle', icon: Triangle },
  { kind: 'star', label: 'Star', icon: Star },
  { kind: 'line', label: 'Line', icon: Minus },
]

export function Sidebar({
  panel,
  onPanel,
  onAddText,
  onAddShape,
  onUpload,
  onBackground,
  onInsertTemplatePage,
}: {
  panel: PanelId
  onPanel: (id: PanelId) => void
  onAddText: (preset: (typeof TEXT_PRESETS)[number]) => void
  onAddShape: (kind: ShapeKind, fill: string) => void
  onUpload: () => void
  onBackground: (color: string) => void
  onInsertTemplatePage: (templateId: string) => void
}) {
  return (
    <aside className="flex h-full w-[min(300px,100vw)] shrink-0 border-r border-ink/10 bg-[#fbf8f2]">
      <div className="flex w-16 flex-col items-center gap-1 border-r border-ink/10 py-3">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const on = panel === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onPanel(tab.id)}
              className={cn(
                'flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium tracking-wide',
                on ? 'bg-ink text-paper' : 'text-stone hover:bg-ink/5',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto p-3">
        {panel === 'text' ? (
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone">
              Add text
            </p>
            {TEXT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onAddText(preset)}
                className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-left hover:border-clay/50"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-stone">
                  {preset.label}
                </div>
                <div
                  className="mt-1 truncate text-ink"
                  style={{
                    fontFamily:
                      preset.font === 'playfair'
                        ? '"Playfair Display", serif'
                        : preset.font === 'fraunces'
                          ? '"Fraunces", serif'
                          : preset.font === 'baskerville'
                            ? '"Libre Baskerville", serif'
                            : preset.font === 'cormorant'
                              ? '"Cormorant Garamond", serif'
                              : '"Space Grotesk", sans-serif',
                    fontSize: Math.min(22, preset.size),
                    fontWeight: preset.bold ? 700 : 500,
                  }}
                >
                  {preset.sample}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {panel === 'elements' ? (
          <div className="space-y-4">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone">
              Shapes
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SHAPES.map((shape) => {
                const Icon = shape.icon
                return (
                  <button
                    key={shape.kind}
                    type="button"
                    onClick={() => onAddShape(shape.kind, '#14110e')}
                    className="flex flex-col items-center gap-2 rounded-xl border border-ink/10 bg-white py-4 text-xs text-stone hover:border-clay/50 hover:text-ink"
                  >
                    <Icon className="h-6 w-6" />
                    {shape.label}
                  </button>
                )
              })}
            </div>
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone">
              Colour
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {FILL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => onAddShape('rect', color)}
                  className="h-8 rounded-md border border-ink/10"
                  style={{ background: color }}
                />
              ))}
            </div>
            <p className="px-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone">
              From templates
            </p>
            <div className="space-y-1">
              {TEMPLATES.slice(0, 6).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onInsertTemplatePage(template.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-ink/5"
                >
                  <LayoutTemplate className="h-3.5 w-3.5 text-stone" />
                  <span className="truncate">{template.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {panel === 'uploads' ? (
          <div className="space-y-3">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone">
              Images
            </p>
            <button
              type="button"
              onClick={onUpload}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-ink/20 bg-white py-10 text-sm text-stone hover:border-clay hover:text-ink"
            >
              <ImagePlus className="h-6 w-6" />
              Upload a photo
            </button>
            <p className="px-1 text-[11px] leading-relaxed text-stone">
              JPEG, PNG, WebP. Photos are flattened onto the page — drag a corner to crop-scale.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['/stock/portrait.jpg', '/stock/abstract.jpg', '/stock/floral.jpg', '/stock/ridge.jpg'].map(
                (src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      const event = new CustomEvent('folio-stock', { detail: src })
                      window.dispatchEvent(event)
                    }}
                    className="overflow-hidden rounded-xl border border-ink/10"
                  >
                    <img src={src} alt="" className="h-20 w-full object-cover" />
                  </button>
                ),
              )}
            </div>
          </div>
        ) : null}

        {panel === 'brand' ? (
          <div className="space-y-4">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone">
              Page colour
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {['#ffffff', '#f6f1e8', '#f3eadb', '#14110e', '#1c312b', '#c45d32', '#0e0c0a', '#fde8d0'].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onBackground(color)}
                    className="h-8 rounded-md border border-ink/10"
                    style={{ background: color }}
                  />
                ),
              )}
            </div>
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone">
              Palettes
            </p>
            <div className="space-y-2">
              {PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => onBackground(palette.colors[1])}
                  className="w-full rounded-xl border border-ink/10 bg-white p-2 text-left hover:border-clay/40"
                >
                  <div className="mb-1.5 text-[11px] font-medium">{palette.name}</div>
                  <div className="flex overflow-hidden rounded-md">
                    {palette.colors.map((color) => (
                      <div key={color} className="h-7 flex-1" style={{ background: color }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
