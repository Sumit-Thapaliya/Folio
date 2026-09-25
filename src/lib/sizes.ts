import type { PageSize } from '../types'

export const PAGE_SIZES: PageSize[] = [
  { id: 'a4', name: 'A4 document', width: 595, height: 842 },
  { id: 'letter', name: 'US Letter', width: 612, height: 792 },
  { id: 'slide', name: 'Presentation 16:9', width: 960, height: 540 },
  { id: 'square', name: 'Square post', width: 600, height: 600 },
  { id: 'story', name: 'Story / reel', width: 540, height: 960 },
  { id: 'card', name: 'Business card', width: 252, height: 144 },
  { id: 'poster', name: 'Poster', width: 720, height: 960 },
]

export function sizeById(id: string): PageSize {
  return PAGE_SIZES.find((s) => s.id === id) ?? PAGE_SIZES[0]
}
