// 整理畫面用：顯示目前這張，同時預載後面 3 張、保留前面 1 張。
import { useEffect, useMemo, useState } from 'react'
import { createPhotoCache, windowAround } from '../sources/photoCache'
import type { PhotoEntry, PhotoSource } from '../types/source'

interface Loaded {
  id: string
  url: string | null
  error: string | null
}

export function usePhotoWindow(source: PhotoSource | null, photos: PhotoEntry[], cursor: number) {
  const cache = useMemo(() => (source ? createPhotoCache(source) : null), [source])
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const currentId = photos[cursor]?.id

  // 換一批照片或離開畫面時，全部釋放
  useEffect(() => () => cache?.dispose(), [cache])

  useEffect(() => {
    if (!cache || !currentId) return
    cache.keep(windowAround(photos, cursor).map((p) => p.id))
    let cancelled = false
    cache
      .get(currentId)
      .then((url) => !cancelled && setLoaded({ id: currentId, url, error: null }))
      .catch((e: Error) => {
        if (!cancelled && e.message !== 'dropped') setLoaded({ id: currentId, url: null, error: e.message })
      })
    return () => {
      cancelled = true
    }
  }, [cache, photos, cursor, currentId])

  // 新的那張還沒好時，繼續顯示上一張（避免畫面閃白），但標記為載入中
  return {
    url: loaded?.url ?? null,
    error: loaded?.id === currentId ? loaded.error : null,
    loading: loaded?.id !== currentId,
  }
}
