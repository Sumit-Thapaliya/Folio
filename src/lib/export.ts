import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import type { PageSize } from '../types'

export async function pageToPng(element: HTMLElement, size: PageSize): Promise<string> {
  return toPng(element, {
    pixelRatio: 2,
    canvasWidth: Math.round(size.width * 2),
    canvasHeight: Math.round(size.height * 2),
    backgroundColor: undefined,
    cacheBust: true,
  })
}

export async function downloadPng(element: HTMLElement, size: PageSize, name: string) {
  const url = await pageToPng(element, size)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || 'folio'}.png`
  a.click()
}

export async function downloadPdf(elements: HTMLElement[], size: PageSize, name: string) {
  const orientation = size.width >= size.height ? 'l' : 'p'
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [size.width, size.height],
  })
  for (let i = 0; i < elements.length; i += 1) {
    const url = await pageToPng(elements[i], size)
    if (i > 0) pdf.addPage([size.width, size.height], orientation)
    pdf.addImage(url, 'PNG', 0, 0, size.width, size.height)
  }
  pdf.save(`${name || 'folio'}.pdf`)
}

export function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name || 'folio'}.json`
  a.click()
  URL.revokeObjectURL(url)
}
