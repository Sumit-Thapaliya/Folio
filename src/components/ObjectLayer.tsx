import type { CanvasObject, Page, PageSize } from '../types'
import { fontStack } from '../lib/fonts'
import { boxOf } from '../lib/geometry'
import { ShapeView } from './ShapeView'

export function ObjectVisual({ object }: { object: CanvasObject }) {
  if (object.type === 'text') {
    const style = object.style
    return (
      <div
        className="w-full whitespace-pre-wrap break-words"
        style={{
          fontFamily: fontStack(style.font),
          fontSize: style.size,
          lineHeight: style.lineHeight,
          fontWeight: style.bold ? 700 : 500,
          fontStyle: style.italic ? 'italic' : 'normal',
          textDecoration: style.underline ? 'underline' : 'none',
          color: style.color,
          textAlign: style.align,
          letterSpacing: style.letterSpacing,
          opacity: object.opacity ?? 1,
        }}
      >
        {object.text}
      </div>
    )
  }
  if (object.type === 'image') {
    return (
      <img
        src={object.src}
        alt=""
        draggable={false}
        className="pointer-events-none h-full w-full select-none object-cover"
        style={{
          opacity: object.opacity ?? 1,
          transform: [
            object.flipX ? 'scaleX(-1)' : '',
            object.flipY ? 'scaleY(-1)' : '',
            object.rotation ? `rotate(${object.rotation}deg)` : '',
          ]
            .filter(Boolean)
            .join(' ') || undefined,
        }}
      />
    )
  }
  return <ShapeView object={object} />
}

export function StaticPage({
  page,
  size,
}: {
  page: Page
  size: PageSize
}) {
  return (
    <div
      className="folio-page relative overflow-hidden"
      style={{
        width: size.width,
        height: size.height,
        background: page.background,
      }}
    >
      {page.objects
        .filter((object) => !object.hidden)
        .map((object) => {
          const box = boxOf(object)
          return (
            <div
              key={object.id}
              className="absolute overflow-hidden"
              style={{
                left: object.x,
                top: object.y,
                width: Math.max(1, box.w),
                height: Math.max(1, box.h),
              }}
            >
              <ObjectVisual object={object} />
            </div>
          )
        })}
    </div>
  )
}

export function PageThumb({
  page,
  size,
  className,
}: {
  page: Page
  size: PageSize
  className?: string
}) {
  const maxW = 220
  const maxH = 280
  const scale = Math.min(maxW / size.width, maxH / size.height)
  return (
    <div
      className={className}
      style={{
        width: size.width * scale,
        height: size.height * scale,
      }}
    >
      <div
        className="origin-top-left shadow-sm"
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${scale})`,
        }}
      >
        <StaticPage page={page} size={size} />
      </div>
    </div>
  )
}
