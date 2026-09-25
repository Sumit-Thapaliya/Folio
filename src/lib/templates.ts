import type { CanvasObject, LooseObject, PageSize, ShapeObject, Template, TextObject, FolioDoc } from '../types'
import { PAGE_SIZES } from './sizes'
import { uid } from './util'

type Raw = LooseObject

function size(id: string): PageSize {
  return PAGE_SIZES.find((s) => s.id === id)!
}

function T(
  x: number,
  y: number,
  w: number,
  text: string,
  style: Partial<TextObject['style']> & { size: number },
): Raw {
  return {
    type: 'text',
    x,
    y,
    w,
    text,
    style: {
      font: 'dm',
      lineHeight: 1.3,
      color: '#14110e',
      align: 'left',
      ...style,
    },
  }
}

function S(
  kind: ShapeObject['kind'],
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  extra: Partial<ShapeObject> = {},
): Raw {
  return { type: 'shape', kind, x, y, w, h, fill, ...extra }
}

function Img(src: string, x: number, y: number, w: number, h: number): Raw {
  return { type: 'image', src, x, y, w, h }
}

export const TEMPLATES: Template[] = [
  {
    id: 'aurora-resume',
    name: 'Aurora resume',
    blurb: 'A quiet two-tone CV for product and design work.',
    category: 'Resume',
    size: size('a4'),
    pages: [
      {
        background: '#f7f3ec',
        objects: [
          S('rect', 0, 0, 595, 168, '#1c312b'),
          S('rect', 0, 168, 8, 674, '#c45d32'),
          T(40, 38, 360, 'Lina Hart', {
            font: 'playfair',
            size: 36,
            color: '#f6f1e8',
            lineHeight: 1.1,
          }),
          T(40, 86, 360, 'PRODUCT DESIGNER  ·  SYSTEMS', {
            font: 'grotesk',
            size: 11,
            color: '#c4a574',
            letterSpacing: 2.2,
            bold: true,
          }),
          T(40, 112, 400, 'Kathmandu  ·  lina.hart@folio.studio  ·  +977 980-000-0000', {
            font: 'dm',
            size: 10,
            color: '#d9c7a8',
          }),
          Img('/stock/portrait.jpg', 430, 28, 128, 160),
          T(40, 196, 220, 'Profile', {
            font: 'grotesk',
            size: 11,
            color: '#c45d32',
            letterSpacing: 1.6,
            bold: true,
          }),
          T(
            40,
            218,
            515,
            'I design tools that feel like paper and behave like software. Eight years across product, brand, and the awkward middle where documents become products.',
            { font: 'baskerville', size: 12, lineHeight: 1.55, color: '#2a2622' },
          ),
          T(40, 292, 220, 'Experience', {
            font: 'grotesk',
            size: 11,
            color: '#c45d32',
            letterSpacing: 1.6,
            bold: true,
          }),
          T(40, 318, 360, 'Staff Product Designer, Northwind', {
            font: 'dm',
            size: 13,
            bold: true,
          }),
          T(410, 320, 140, '2022 — now', {
            font: 'dm',
            size: 11,
            color: '#5c564e',
            align: 'right',
          }),
          T(
            40,
            340,
            515,
            'Led the redesign of a document workspace used by 40k teams. Cut first-edit time by 28%. Built the type, layout, and export system the rest of the product still sits on.',
            { font: 'dm', size: 11, lineHeight: 1.5, color: '#3f3a34' },
          ),
          T(40, 410, 360, 'Senior Designer, Field & Form', {
            font: 'dm',
            size: 13,
            bold: true,
          }),
          T(410, 412, 140, '2018 — 2022', {
            font: 'dm',
            size: 11,
            color: '#5c564e',
            align: 'right',
          }),
          T(
            40,
            432,
            515,
            'Brand, packaging, and a small editorial site. Taught engineers to see type. Shipped a magazine that still gets stolen from waiting rooms.',
            { font: 'dm', size: 11, lineHeight: 1.5, color: '#3f3a34' },
          ),
          T(40, 502, 360, 'Designer, Atelier West', {
            font: 'dm',
            size: 13,
            bold: true,
          }),
          T(410, 504, 140, '2016 — 2018', {
            font: 'dm',
            size: 11,
            color: '#5c564e',
            align: 'right',
          }),
          T(
            40,
            524,
            515,
            'Identity systems for restaurants and a regional museum. Learned that a good letterhead is a business card that lasts a year.',
            { font: 'dm', size: 11, lineHeight: 1.5, color: '#3f3a34' },
          ),
          S('line', 40, 590, 515, 1.2, '#d9c7a8'),
          T(40, 610, 240, 'Selected work', {
            font: 'grotesk',
            size: 11,
            color: '#c45d32',
            letterSpacing: 1.6,
            bold: true,
          }),
          T(300, 610, 240, 'Tools', {
            font: 'grotesk',
            size: 11,
            color: '#c45d32',
            letterSpacing: 1.6,
            bold: true,
          }),
          T(40, 634, 240, 'Folio workspace\nPaper press identity\nNorthwind export engine\nMuseum wayfinding', {
            font: 'dm',
            size: 12,
            lineHeight: 1.7,
            color: '#2a2622',
          }),
          T(300, 634, 250, 'Figma  ·  Type  ·  HTML/CSS\nPrototyping  ·  Design systems\nWorkshop facilitation', {
            font: 'dm',
            size: 12,
            lineHeight: 1.7,
            color: '#2a2622',
          }),
        ],
      },
    ],
  },
  {
    id: 'serif-cv',
    name: 'Serif curriculum',
    blurb: 'Editorial, one column, for writers and researchers.',
    category: 'Resume',
    size: size('a4'),
    pages: [
      {
        background: '#fbfaf6',
        objects: [
          T(64, 64, 460, 'Asha Tamang', {
            font: 'cormorant',
            size: 48,
            lineHeight: 1,
            color: '#1a1814',
          }),
          S('rect', 64, 128, 72, 3, '#1a1814'),
          T(64, 148, 460, 'Historian & editor', {
            font: 'dm',
            size: 13,
            italic: true,
            color: '#5c564e',
          }),
          T(
            64,
            200,
            467,
            'I write about cities, archives, and the paper trails people leave behind. Currently finishing a book on Kathmandu’s print shops of the 1970s.',
            { font: 'baskerville', size: 13, lineHeight: 1.65 },
          ),
          T(64, 290, 467, 'Appointments', {
            font: 'grotesk',
            size: 10,
            letterSpacing: 2,
            bold: true,
            color: '#c45d32',
          }),
          T(64, 318, 467, 'Editor, Himalayan Review — 2021–present', {
            font: 'cormorant',
            size: 22,
            lineHeight: 1.2,
          }),
          T(
            64,
            348,
            467,
            'Commission essays, design the issue, and keep a 64-page journal feeling like a book. Raised subscriber retention by simply printing on better stock.',
            { font: 'baskerville', size: 12, lineHeight: 1.6, color: '#3f3a34' },
          ),
          T(64, 430, 467, 'Research fellow, Patan Museum — 2018–2021', {
            font: 'cormorant',
            size: 22,
            lineHeight: 1.2,
          }),
          T(
            64,
            460,
            467,
            'Catalogued a donation of trade lithographs. Wrote wall texts that visitors actually finished.',
            { font: 'baskerville', size: 12, lineHeight: 1.6, color: '#3f3a34' },
          ),
          T(64, 530, 467, 'Education', {
            font: 'grotesk',
            size: 10,
            letterSpacing: 2,
            bold: true,
            color: '#c45d32',
          }),
          T(
            64,
            556,
            467,
            'M.A. History, Jawaharlal Nehru University\nB.A. English, Tribhuvan University',
            { font: 'baskerville', size: 13, lineHeight: 1.7 },
          ),
          T(64, 760, 467, 'asha.tamang@folio.studio   ·   Patan, Nepal', {
            font: 'dm',
            size: 11,
            color: '#5c564e',
          }),
        ],
      },
    ],
  },
  {
    id: 'garden-invite',
    name: 'Garden invitation',
    blurb: 'A warm card for dinners, weddings, and openings.',
    category: 'Invitation',
    size: size('a4'),
    pages: [
      {
        background: '#f6e6d2',
        objects: [
          Img('/stock/floral.jpg', 0, 0, 595, 842),
          S('rect', 48, 120, 499, 600, '#fbf6ee', { opacity: 0.92, radius: 8 }),
          T(80, 170, 430, 'YOU ARE INVITED', {
            font: 'grotesk',
            size: 11,
            letterSpacing: 4,
            align: 'center',
            bold: true,
            color: '#c45d32',
          }),
          T(80, 210, 430, 'An evening in\nthe garden', {
            font: 'cormorant',
            size: 48,
            lineHeight: 1.05,
            align: 'center',
            color: '#1c312b',
          }),
          S('line', 230, 330, 135, 1, '#c4a574'),
          T(
            90,
            360,
            410,
            'Saturday, 18 October  ·  6 o’clock\nThe Ridge House, Godavari',
            { font: 'baskerville', size: 15, lineHeight: 1.7, align: 'center', color: '#3f3a34' },
          ),
          T(
            90,
            460,
            410,
            'Dinner under the paper lanterns.\nDress for grass. Bring a story.',
            { font: 'cormorant', size: 20, lineHeight: 1.45, align: 'center', italic: true, color: '#2c4a3e' },
          ),
          T(90, 620, 410, 'Kindly reply by the first of October', {
            font: 'dm',
            size: 12,
            align: 'center',
            color: '#5c564e',
          }),
        ],
      },
    ],
  },
  {
    id: 'night-poster',
    name: 'Night poster',
    blurb: 'Big type, one image, for talks and festivals.',
    category: 'Poster',
    size: size('poster'),
    pages: [
      {
        background: '#0e0c0a',
        objects: [
          Img('/stock/ridge.jpg', 0, 0, 720, 520),
          S('rect', 0, 430, 720, 140, '#0e0c0a', { opacity: 0.55 }),
          T(40, 448, 640, 'THE RIDGE TALKS', {
            font: 'grotesk',
            size: 14,
            letterSpacing: 6,
            bold: true,
            color: '#c4a574',
          }),
          T(36, 560, 650, 'How paper\nsurvives the\nmountain.', {
            font: 'fraunces',
            size: 64,
            lineHeight: 0.95,
            color: '#f6f1e8',
          }),
          T(40, 860, 400, '12 Nov  ·  Patan Museum courtyard  ·  5pm', {
            font: 'dm',
            size: 14,
            color: '#d9c7a8',
          }),
          S('rect', 520, 848, 160, 44, '#c45d32', { radius: 2 }),
          T(520, 858, 160, 'FREE ENTRY', {
            font: 'grotesk',
            size: 13,
            align: 'center',
            bold: true,
            color: '#f6f1e8',
            letterSpacing: 1.4,
          }),
        ],
      },
    ],
  },
  {
    id: 'pitch-cover',
    name: 'Pitch cover',
    blurb: 'A 16:9 title slide with room to breathe.',
    category: 'Presentation',
    size: size('slide'),
    pages: [
      {
        background: '#14110e',
        objects: [
          S('rect', 0, 0, 18, 540, '#c45d32'),
          T(72, 120, 700, 'FOLIO STUDIO', {
            font: 'grotesk',
            size: 13,
            letterSpacing: 4,
            bold: true,
            color: '#c4a574',
          }),
          T(72, 170, 780, 'Documents, finally\ntreated as design.', {
            font: 'playfair',
            size: 52,
            lineHeight: 1.08,
            color: '#f6f1e8',
          }),
          T(72, 430, 500, 'Series A  ·  confidential  ·  2026', {
            font: 'dm',
            size: 14,
            color: '#9a9186',
          }),
          Img('/stock/abstract.jpg', 700, 300, 220, 200),
        ],
      },
      {
        background: '#f6f1e8',
        objects: [
          T(72, 64, 800, 'The problem', {
            font: 'grotesk',
            size: 14,
            letterSpacing: 3,
            bold: true,
            color: '#c45d32',
          }),
          T(72, 110, 820, 'People still layout\nresumes in Word.', {
            font: 'playfair',
            size: 44,
            lineHeight: 1.12,
          }),
          T(
            72,
            250,
            700,
            'Folio is a page you can actually grab: type, image, and shape as objects. What you drag is what prints.',
            { font: 'dm', size: 18, lineHeight: 1.5, color: '#3f3a34' },
          ),
          S('rect', 72, 400, 180, 8, '#1c312b'),
        ],
      },
    ],
  },
  {
    id: 'quote-card',
    name: 'Quote card',
    blurb: 'A square post for a line worth repeating.',
    category: 'Social',
    size: size('square'),
    pages: [
      {
        background: '#1c312b',
        objects: [
          S('ellipse', -80, -80, 260, 260, '#c45d32', { opacity: 0.35 }),
          S('ellipse', 460, 430, 220, 220, '#c4a574', { opacity: 0.25 }),
          T(56, 80, 488, 'FOLIO', {
            font: 'grotesk',
            size: 12,
            letterSpacing: 6,
            bold: true,
            color: '#c4a574',
          }),
          T(56, 160, 490, '“A page is a room.\nPut the furniture\nwhere people can\nwalk.”', {
            font: 'cormorant',
            size: 42,
            lineHeight: 1.12,
            color: '#f6f1e8',
          }),
          T(56, 500, 490, '— Lina Hart, on layout', {
            font: 'dm',
            size: 14,
            italic: true,
            color: '#d9c7a8',
          }),
        ],
      },
    ],
  },
  {
    id: 'letterhead',
    name: 'Studio letterhead',
    blurb: 'A page you can actually send.',
    category: 'Stationery',
    size: size('a4'),
    pages: [
      {
        background: '#fbfaf6',
        objects: [
          S('rect', 0, 0, 595, 12, '#1c312b'),
          T(48, 40, 300, 'FOLIO', {
            font: 'grotesk',
            size: 22,
            letterSpacing: 6,
            bold: true,
            color: '#1c312b',
          }),
          T(320, 44, 227, 'Design studio\nPatan, Nepal', {
            font: 'dm',
            size: 11,
            align: 'right',
            lineHeight: 1.45,
            color: '#5c564e',
          }),
          S('line', 48, 100, 499, 0.8, '#d9c7a8'),
          T(
            48,
            140,
            499,
            'Dear colleague,\n\nThank you for the notes on the autumn issue. The paper stock you suggested holds the terracotta much better than the previous run — we’ll switch for November.\n\nWarmly,',
            { font: 'baskerville', size: 13, lineHeight: 1.7, color: '#2a2622' },
          ),
          T(48, 360, 300, 'Lina Hart', {
            font: 'cormorant',
            size: 22,
            italic: true,
          }),
          T(48, 780, 499, 'folio.studio   ·   hello@folio.studio   ·   +977 1 555 0199', {
            font: 'dm',
            size: 10,
            color: '#8a8378',
            align: 'center',
          }),
        ],
      },
    ],
  },
  {
    id: 'workshop-flyer',
    name: 'Workshop flyer',
    blurb: 'Split layout for a half-day class.',
    category: 'Poster',
    size: size('a4'),
    pages: [
      {
        background: '#f3eadb',
        objects: [
          S('rect', 0, 0, 595, 842, '#f3eadb'),
          S('rect', 0, 0, 248, 842, '#14110e'),
          Img('/stock/abstract.jpg', 18, 80, 212, 212),
          T(24, 330, 200, 'SAT  04 OCT\n10:00–14:00', {
            font: 'grotesk',
            size: 14,
            color: '#c4a574',
            lineHeight: 1.5,
            letterSpacing: 1,
          }),
          T(24, 700, 200, 'Studio 3\nPatan Dhoka', {
            font: 'dm',
            size: 13,
            color: '#d9c7a8',
            lineHeight: 1.5,
          }),
          T(280, 72, 280, 'Type on\nthe page', {
            font: 'fraunces',
            size: 44,
            lineHeight: 1.02,
            color: '#14110e',
          }),
          T(
            280,
            200,
            280,
            'A half-day workshop on setting resumes, posters, and letters without a template fighting you.',
            { font: 'dm', size: 14, lineHeight: 1.5, color: '#3f3a34' },
          ),
          T(280, 310, 280, '01   Measure the page in points\n02   One typeface, two weights\n03   Images as objects, not “in line”\n04   Export what you see', {
            font: 'dm',
            size: 14,
            lineHeight: 1.85,
            color: '#14110e',
          }),
          S('rect', 280, 540, 220, 52, '#c45d32', { radius: 4 }),
          T(280, 554, 220, 'Rs 2,500  ·  12 seats', {
            font: 'grotesk',
            size: 14,
            align: 'center',
            bold: true,
            color: '#f6f1e8',
          }),
        ],
      },
    ],
  },
  {
    id: 'story-drop',
    name: 'Story drop',
    blurb: 'Tall frame for a launch or announcement.',
    category: 'Social',
    size: size('story'),
    pages: [
      {
        background: '#c45d32',
        objects: [
          T(40, 80, 460, 'NEW', {
            font: 'grotesk',
            size: 14,
            letterSpacing: 8,
            bold: true,
            color: '#f6f1e8',
          }),
          T(36, 200, 470, 'Folio\nis open.', {
            font: 'playfair',
            size: 80,
            lineHeight: 0.95,
            color: '#14110e',
          }),
          T(40, 720, 460, 'A Canva-like studio for documents.\nDrag. Type. Print.', {
            font: 'dm',
            size: 18,
            lineHeight: 1.45,
            color: '#f6f1e8',
          }),
        ],
      },
    ],
  },
  {
    id: 'business-card',
    name: 'Calling card',
    blurb: 'Small, loud, two sides of the same idea.',
    category: 'Stationery',
    size: size('card'),
    pages: [
      {
        background: '#1c312b',
        objects: [
          T(16, 18, 220, 'FOLIO', {
            font: 'grotesk',
            size: 16,
            letterSpacing: 4,
            bold: true,
            color: '#f6f1e8',
          }),
          T(16, 90, 220, 'Lina Hart\nProduct designer', {
            font: 'dm',
            size: 11,
            lineHeight: 1.4,
            color: '#d9c7a8',
          }),
        ],
      },
      {
        background: '#f6f1e8',
        objects: [
          T(16, 18, 220, 'folio.studio', {
            font: 'playfair',
            size: 18,
            color: '#1c312b',
          }),
          T(16, 90, 220, 'hello@folio.studio\nPatan, Nepal', {
            font: 'dm',
            size: 11,
            lineHeight: 1.4,
            color: '#5c564e',
          }),
        ],
      },
    ],
  },
]

export const PALETTES = [
  { name: 'Ink & clay', colors: ['#14110e', '#f6f1e8', '#c45d32', '#c4a574'] },
  { name: 'Forest', colors: ['#1c312b', '#f3eadb', '#c4a574', '#4d6b5c'] },
  { name: 'Midnight', colors: ['#0e0c0a', '#f6f1e8', '#3b4a7a', '#c45d32'] },
  { name: 'Blush', colors: ['#4a2424', '#fde8d0', '#c45d32', '#7a1f1f'] },
  { name: 'Paper', colors: ['#2a2622', '#fbfaf6', '#d9c7a8', '#5c564e'] },
  { name: 'Ocean', colors: ['#10242b', '#e8f0ee', '#2c6b6a', '#c4a574'] },
]

export function instantiateTemplate(template: Template): FolioDoc {
  return {
    id: uid('doc'),
    name: template.name,
    size: { ...template.size },
    updatedAt: Date.now(),
    pages: template.pages.map((page) => ({
      id: uid('page'),
      background: page.background,
      objects: page.objects.map((object) => ({ ...object, id: uid('obj') }) as CanvasObject),
    })),
  }
}

export function blankDoc(pageSize: PageSize, name = 'Untitled design'): FolioDoc {
  return {
    id: uid('doc'),
    name,
    size: { ...pageSize },
    updatedAt: Date.now(),
    pages: [{ id: uid('page'), background: '#ffffff', objects: [] }],
  }
}
