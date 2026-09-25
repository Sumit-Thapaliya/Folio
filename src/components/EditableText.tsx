import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { cn } from '../lib/cn'

function readEditableText(element: HTMLElement): string {
  const inner = (element as HTMLElement & { innerText?: string }).innerText
  const text = typeof inner === 'string' ? inner : (element.textContent ?? '')
  return text.replace(/\u00a0/g, ' ').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export function EditableText({
  value,
  active,
  onChange,
  onDone,
  className,
  style,
  placeholder,
}: {
  value: string
  active: boolean
  onChange: (next: string) => void
  onDone: () => void
  className?: string
  style?: CSSProperties
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    if (active && document.activeElement === element) return
    if (readEditableText(element) !== value) element.textContent = value
  }, [value, active])

  useLayoutEffect(() => {
    const element = ref.current
    if (!active || !element) return
    element.focus()
    const selection = window.getSelection?.()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [active])

  return (
    <div
      ref={ref}
      contentEditable={active}
      suppressContentEditableWarning
      role="textbox"
      spellCheck={false}
      dir="ltr"
      data-placeholder={placeholder}
      onInput={(event) => {
        const element = event.currentTarget
        if ((element.textContent ?? '') === '' && element.innerHTML !== '') element.innerHTML = ''
        onChange(readEditableText(element))
      }}
      onBlur={() => {
        onDone()
        const element = ref.current
        if (element && readEditableText(element) !== valueRef.current) {
          element.textContent = valueRef.current
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.currentTarget.blur()
          return
        }
        event.stopPropagation()
      }}
      onPaste={(event) => {
        event.preventDefault()
        const text = event.clipboardData.getData('text/plain')
        const element = ref.current
        try {
          document.execCommand('insertText', false, text)
        } catch {
          const selection = window.getSelection?.()
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            range.insertNode(document.createTextNode(text))
            range.collapse(false)
          }
        }
        if (element) onChange(readEditableText(element))
      }}
      className={cn('w-full whitespace-pre-wrap outline-none break-words', className)}
      style={{ unicodeBidi: 'plaintext', ...style }}
    />
  )
}
