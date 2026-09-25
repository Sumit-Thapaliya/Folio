import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { FolioDoc } from '../types'
import { TEMPLATES, blankDoc, instantiateTemplate } from '../lib/templates'
import { PAGE_SIZES } from '../lib/sizes'
import { deleteDoc, loadFullDocs } from '../lib/storage'
import { PageThumb } from './ObjectLayer'

const CATEGORIES = ['All', 'Resume', 'Invitation', 'Poster', 'Presentation', 'Social', 'Stationery']

export function Landing({ onOpen }: { onOpen: (doc: FolioDoc) => void }) {
  const [category, setCategory] = useState('All')
  const [recent, setRecent] = useState(() => loadFullDocs())
  const [blankOpen, setBlankOpen] = useState(false)

  const templates = useMemo(
    () => TEMPLATES.filter((t) => category === 'All' || t.category === category),
    [category],
  )

  return (
    <div className="min-h-full bg-[#f3eadb] text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl tracking-tight">Folio</span>
          <span className="hidden text-sm text-stone sm:inline">a studio for documents</span>
        </div>
        <button
          type="button"
          onClick={() => setBlankOpen(true)}
          className="flex h-10 items-center gap-1 rounded-full bg-ink px-4 text-sm text-paper"
        >
          <Plus className="h-4 w-4" />
          Blank page
        </button>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6">
        <h1 className="max-w-2xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          Design the page
          <span className="italic text-clay"> as an object.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-stone">
          Folio is a Canva-like editor for resumes, posters, letters, and slides. Drag type, drop
          photos, snap to the margins, download a PDF. Designs stay in this browser — no account,
          no server.
        </p>
      </section>

      {recent.length ? (
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone">Recent</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recent.map((doc) => (
              <div key={doc.id} className="group relative">
                <button type="button" onClick={() => onOpen(doc)} className="block w-full text-left">
                  <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-white/70 ring-1 ring-ink/10">
                    {doc.pages[0] ? <PageThumb page={doc.pages[0]} size={doc.size} /> : null}
                  </div>
                  <div className="mt-2 truncate text-sm font-medium">{doc.name}</div>
                  <div className="text-[11px] text-stone">{doc.size.name}</div>
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-2 hidden rounded-full bg-white/90 p-1.5 text-stone shadow group-hover:block hover:text-red-700"
                  onClick={() => {
                    deleteDoc(doc.id)
                    setRecent(loadFullDocs())
                  }}
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone">Start from a template</h2>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-3 py-1 text-xs ${
                  category === item ? 'bg-ink text-paper' : 'text-stone hover:bg-ink/5'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {templates.map((template) => {
            const preview = instantiateTemplate(template)
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onOpen(instantiateTemplate(template))}
                className="group text-left"
              >
                <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-[#e8dfd2] ring-1 ring-ink/10 transition group-hover:ring-clay/60 sm:h-64">
                  <PageThumb page={preview.pages[0]} size={preview.size} />
                </div>
                <div className="mt-2.5 text-sm font-semibold">{template.name}</div>
                <div className="text-[12px] leading-snug text-stone">{template.blurb}</div>
              </button>
            )
          })}
        </div>
      </section>

      {blankOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setBlankOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#fbf8f2] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-display text-2xl">A blank page</h3>
            <p className="mt-1 text-sm text-stone">Pick a size. You can add more pages later.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {PAGE_SIZES.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => onOpen(blankDoc(size))}
                  className="rounded-2xl border border-ink/10 bg-white px-3 py-3 text-left hover:border-clay"
                >
                  <div className="text-sm font-semibold">{size.name}</div>
                  <div className="text-[11px] text-stone">
                    {size.width} × {size.height} pt
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-ink/10 px-6 py-6 text-center text-xs text-stone">
        Folio stores designs in this browser. Download a PDF when you want a file.
      </footer>
    </div>
  )
}
