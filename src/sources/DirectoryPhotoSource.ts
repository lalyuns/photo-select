// PhotoSource 的真實版：讀使用者用 Chrome 選的資料夾（只讀第一層，不進子資料夾）。
import type { PhotoEntry, PhotoSource, ScanResult } from '../types/source'
import { classifyFile, naturalCompare } from './fileNames'

/** 一次同時讀幾個檔案的資訊（太多會卡，太少會慢） */
const SCAN_BATCH = 64

export interface DirectoryPhotoSource extends PhotoSource {
  readonly handle: FileSystemDirectoryHandle
}

export function createDirectoryPhotoSource(dir: FileSystemDirectoryHandle): DirectoryPhotoSource {
  // 掃描後記住每個檔名對應的檔案 handle，getFile 時直接用
  const files = new Map<string, FileSystemFileHandle>()

  return {
    label: dir.name,
    handle: dir,

    async scan(): Promise<ScanResult> {
      files.clear()
      const unsupported: Record<string, number> = {}
      const supported: FileSystemFileHandle[] = []

      for await (const entry of dir.values()) {
        if (entry.kind !== 'file') continue // 子資料夾先不處理
        const kind = classifyFile(entry.name)
        if (kind === 'supported') supported.push(entry)
        else if (kind === 'heic' || kind === 'raw') unsupported[kind] = (unsupported[kind] ?? 0) + 1
      }

      // 讀檔案大小與修改時間（只讀資訊，不讀內容），分批並行
      const photos: PhotoEntry[] = []
      for (let i = 0; i < supported.length; i += SCAN_BATCH) {
        const batch = supported.slice(i, i + SCAN_BATCH)
        const infos = await Promise.all(batch.map((h) => h.getFile()))
        infos.forEach((file, j) => {
          files.set(file.name, batch[j])
          photos.push({ id: file.name, name: file.name, size: file.size, lastModified: file.lastModified })
        })
      }

      photos.sort((a, b) => naturalCompare(a.name, b.name))
      return { photos, unsupported }
    },

    async getFile(id: string): Promise<File> {
      const handle = files.get(id)
      if (!handle) throw new Error(`找不到 ${id}，可能已被移動或刪除`)
      return handle.getFile()
    },
  }
}
