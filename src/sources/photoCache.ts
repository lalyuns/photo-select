// 照片預載快取：只保留目前這張附近的幾張，其他的立刻釋放記憶體。
// 三千張的資料夾也只會同時佔用 4～5 張照片的記憶體。
import type { PhotoSource } from '../types/source'

interface Entry {
  promise: Promise<string>
  url?: string
  dropped: boolean
}

export interface PhotoCache {
  /** 只保留這些 id，其他的釋放；還沒載入的開始載入 */
  keep(ids: string[]): void
  /** 取得某張的網址（已經解碼完成，顯示時不會閃） */
  get(id: string): Promise<string>
  /** 全部釋放（換一批照片或離開畫面時） */
  dispose(): void
}

export function createPhotoCache(source: PhotoSource): PhotoCache {
  const entries = new Map<string, Entry>()

  function load(id: string): Entry {
    const existing = entries.get(id)
    if (existing) return existing
    const entry: Entry = { dropped: false, promise: Promise.resolve('') }
    entry.promise = source.getFile(id).then(async (file) => {
      const url = URL.createObjectURL(file)
      // 先在背景解碼，真正顯示時就不用等
      try {
        const img = new Image()
        img.src = url
        await img.decode()
      } catch {
        // 解碼失敗（檔案壞掉）還是回傳網址，讓畫面自己顯示錯誤
      }
      if (entry.dropped) {
        URL.revokeObjectURL(url) // 載入期間已經被丟掉了
        throw new Error('dropped')
      }
      entry.url = url
      return url
    })
    entry.promise.catch(() => {}) // 避免「未處理的錯誤」警告；呼叫 get() 的人仍會收到錯誤
    entries.set(id, entry)
    return entry
  }

  function drop(id: string, entry: Entry) {
    entry.dropped = true
    if (entry.url) URL.revokeObjectURL(entry.url)
    entries.delete(id)
  }

  return {
    keep(ids) {
      const wanted = new Set(ids)
      for (const [id, entry] of entries) if (!wanted.has(id)) drop(id, entry)
      for (const id of ids) load(id)
    },
    get(id) {
      return load(id).promise
    },
    dispose() {
      for (const [id, entry] of entries) drop(id, entry)
    },
  }
}

/** 目前這張附近要保留哪些：前 behind 張 + 自己 + 後 ahead 張（自己排第一個先載入） */
export function windowAround<T>(items: T[], index: number, behind = 1, ahead = 3): T[] {
  const result: T[] = []
  if (items[index] !== undefined) result.push(items[index])
  for (let i = 1; i <= ahead; i++) if (items[index + i] !== undefined) result.push(items[index + i])
  for (let i = 1; i <= behind; i++) if (items[index - i] !== undefined) result.push(items[index - i])
  return result
}
