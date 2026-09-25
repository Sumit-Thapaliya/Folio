import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FolioDoc } from '../types'
import { StaticPage } from './ObjectLayer'

export function PreviewMode({
  doc,
  startPage,
  onClose,
}: {
  doc: FolioDoc
  startPage: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startPage)
  const page = doc.pages[index]
  const scale = Math.min(
    (window.innerWidth - 80) / doc.size.width,
    (window.innerHeight - 100) / doc.size.height,
    1.4,
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(doc.pages.length - 1, i + 1))
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doc.pages.length, onClose])

  if (!page) return null

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-ink">
      <div className="flex items-center justify-between px-4 py-3 text-paper">
        <span className="text-sm">
          {doc.name} · {index + 1}/{doc.pages.length}
        </span>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-4 px-4 pb-6">
        <button
          type="button"
          className="rounded-full p-2 text-paper/70 hover:bg-white/10 disabled:opacity-30"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
        <div
          className="overflow-hidden shadow-2xl"
          style={{ width: doc.size.width * scale, height: doc.size.height * scale }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <StaticPage
              page={{ ...page, objects: page.objects.filter((object) => !object.hidden) }}
              size={doc.size}
            />
          </div>
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-paper/70 hover:bg-white/10 disabled:opacity-30"
          disabled={index === doc.pages.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>
    </div>
  )
}
