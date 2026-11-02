// 拿到某張照片的網址（object URL），換張或畫面關閉時自動釋放記憶體。
import { useEffect, useState } from 'react'
import type { PhotoSource } from '../types/source'

interface Loaded {
  photoId: string
  url: string | null
  error: string | null
}

export function usePhotoUrl(source: PhotoSource | null, photoId: string | undefined) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!source || !photoId) return
    let cancelled = false
    let created: string | null = null
    source
      .getFile(photoId)
      .then((file) => {
        if (cancelled) return
        created = URL.createObjectURL(file)
        setLoaded({ photoId, url: created, error: null })
      })
      .catch((e: Error) => {
        if (!cancelled) setLoaded({ photoId, url: null, error: e.message })
      })
    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created) // 換張時釋放上一張
    }
  }, [source, photoId])

  // 還在載入新的那張時，不要顯示上一張的結果
  const current = loaded && loaded.photoId === photoId ? loaded : null
  return { url: current?.url ?? null, error: current?.error ?? null }
}
