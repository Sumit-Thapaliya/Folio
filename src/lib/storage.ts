import type { DocMeta, FolioDoc } from '../types'

const KEY = 'folio.docs.v1'

function readAll(): FolioDoc[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FolioDoc[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(docs: FolioDoc[]) {
  localStorage.setItem(KEY, JSON.stringify(docs))
}

export function listDocs(): DocMeta[] {
  return readAll()
    .map((doc) => ({
      id: doc.id,
      name: doc.name,
      sizeName: doc.size.name,
      updatedAt: doc.updatedAt,
      thumbBackground: doc.pages[0]?.background ?? '#f6f1e8',
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function loadDoc(id: string): FolioDoc | null {
  return readAll().find((doc) => doc.id === id) ?? null
}

export function saveDoc(doc: FolioDoc): void {
  const docs = readAll().filter((item) => item.id !== doc.id)
  docs.push({ ...doc, updatedAt: Date.now() })
  writeAll(docs)
}

export function deleteDoc(id: string): void {
  writeAll(readAll().filter((doc) => doc.id !== id))
}

export function loadFullDocs(): FolioDoc[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt)
}
