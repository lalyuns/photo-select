// 縮圖快取：檢查畫面用。把原圖縮成小張的 JPEG，最多留 max 張，太舊的釋放。
// 3000 張的資料夾，畫面上只會同時產生看得到的那幾十張縮圖。
import type { PhotoSource } from '../types/source'

export interface ThumbnailCache {
  get(id: string): Promise<string>
  dispose(): void
}

export function createThumbnailCache(source: PhotoSource, { width = 500, max = 240, concurrency = 3 } = {}): ThumbnailCache {
  const cache = new Map<string, Promise<string>>() // Map 會記住加入順序，最舊的在最前面
  const urls = new Map<string, string>()
  const queue: (() => void)[] = []
  let running = 0
  // 每次 dispose 就換一代；舊一代還在做的縮圖做完會直接丟掉。
  // dispose 之後還能繼續用（React 開發模式會刻意「清理再重來」一次）
  let generation = 0

  // 同時最多做 concurrency 張，其餘排隊
  function schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        running++
        task().then(resolve, reject).finally(() => {
          running--
          queue.shift()?.()
        })
      }
      if (running < concurrency) run()
      else queue.push(run)
    })
  }

  async function make(id: string): Promise<string> {
    const startedIn = generation
    const file = await source.getFile(id)
    // createImageBitmap 會在背景解碼並縮小，不會卡住畫面
    const bitmap = await createImageBitmap(file, { resizeWidth: width, resizeQuality: 'medium' })
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
    bitmap.close()
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 })
    const url = URL.createObjectURL(blob)
    if (startedIn !== generation) {
      URL.revokeObjectURL(url)
      throw new Error('disposed')
    }
    urls.set(id, url)
    return url
  }

  function evict() {
    while (cache.size > max) {
      const oldest = cache.keys().next().value as string
      cache.delete(oldest)
      const url = urls.get(oldest)
      if (url) URL.revokeObjectURL(url)
      urls.delete(oldest)
    }
  }

  return {
    get(id) {
      let promise = cache.get(id)
      if (promise) {
        cache.delete(id) // 移到最後面 = 最近用過
        cache.set(id, promise)
        return promise
      }
      promise = schedule(() => make(id))
      promise.catch(() => cache.delete(id)) // 失敗的不留，下次重試
      cache.set(id, promise)
      evict()
      return promise
    },
    dispose() {
      generation++
      for (const url of urls.values()) URL.revokeObjectURL(url)
      urls.clear()
      cache.clear()
      queue.length = 0
    },
  }
}
