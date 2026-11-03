// 歸檔流程：把每張已分類的照片複製到對應的分類資料夾。
// 檢查畫面（軌道 D）呼叫 runArchive()，不用管同時複製、失敗重試這些細節。
import type { Category } from '../types/model'
import type { ArchiveTarget, PhotoEntry, PhotoSource } from '../types/source'

/** 同時複製幾張。太多會讓硬碟忙不過來，2～4 比較穩 */
const CONCURRENCY = 3

export interface ArchiveJob {
  photo: PhotoEntry
  folderName: string
}

export interface ArchiveResult {
  copied: { photo: PhotoEntry; folderName: string; savedAs: string }[]
  failed: { photo: PhotoEntry; folderName: string; reason: string }[]
  /** 沒有分類、所以沒有複製的照片 */
  skipped: PhotoEntry[]
}

export interface ArchiveProgress {
  done: number
  total: number
  current?: string
}

/** 依照分類結果排出要複製的清單 */
export function planArchive(
  photos: PhotoEntry[],
  assignments: Record<string, string>,
  categories: Category[],
): { jobs: ArchiveJob[]; skipped: PhotoEntry[] } {
  const folderOf = new Map(categories.map((c) => [c.id, c.folderName]))
  const jobs: ArchiveJob[] = []
  const skipped: PhotoEntry[] = []
  for (const photo of photos) {
    const folderName = folderOf.get(assignments[photo.id])
    if (folderName) jobs.push({ photo, folderName })
    else skipped.push(photo)
  }
  return { jobs, skipped }
}

export async function runArchive(options: {
  jobs: ArchiveJob[]
  skipped?: PhotoEntry[]
  source: PhotoSource
  target: ArchiveTarget
  onProgress?(p: ArchiveProgress): void
  /** 傳入 AbortSignal 可以中途停止（已經在複製的那幾張會做完） */
  signal?: AbortSignal
}): Promise<ArchiveResult> {
  const { jobs, source, target, onProgress, signal } = options
  const result: ArchiveResult = { copied: [], failed: [], skipped: options.skipped ?? [] }
  let next = 0
  let done = 0
  onProgress?.({ done, total: jobs.length })

  // 開 CONCURRENCY 個「工人」，各自從清單拿下一張來做，直到做完
  async function worker() {
    while (next < jobs.length && !signal?.aborted) {
      const job = jobs[next++]
      try {
        const file = await source.getFile(job.photo.id)
        const savedAs = await target.copy(file, job.folderName)
        result.copied.push({ ...job, savedAs })
      } catch (e) {
        // 一張失敗不影響其他張，最後再列出失敗清單
        result.failed.push({ ...job, reason: describeError(e) })
      }
      done++
      onProgress?.({ done, total: jobs.length, current: job.photo.name })
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker))
  return result
}

/** 把瀏覽器的英文錯誤翻成使用者看得懂的話 */
export function describeError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : ''
  switch (name) {
    case 'NotFoundError': return '找不到這個檔案，可能已被移動或刪除'
    case 'NotAllowedError':
    case 'SecurityError': return '沒有權限讀取或寫入這個位置'
    case 'QuotaExceededError': return '磁碟空間不足'
    case 'NoModificationAllowedError':
    case 'InvalidModificationError': return '檔案正被其他程式使用中'
    case 'NotReadableError': return '檔案讀不到，可能已損壞或在外接硬碟上被拔除'
  }
  return e instanceof Error ? e.message : String(e)
}
