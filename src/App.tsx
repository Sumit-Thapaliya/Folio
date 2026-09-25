import { useState } from 'react'
import type { FolioDoc } from './types'
import { Landing } from './components/Landing'
import { Editor } from './components/Editor'
import { saveDoc } from './lib/storage'

export default function App() {
  const [doc, setDoc] = useState<FolioDoc | null>(null)

  if (!doc) {
    return (
      <Landing
        onOpen={(next) => {
          saveDoc(next)
          setDoc(next)
        }}
      />
    )
  }

  return (
    <Editor
      key={doc.id}
      initial={doc}
      onBack={(current) => {
        saveDoc(current)
        setDoc(null)
      }}
    />
  )
}
