// ArchiveTarget 的示範版：不真的寫檔，只記錄「本來會複製到哪」。
// 同名改名規則跟真實版一樣，方便測試檢查畫面與完成畫面。
import type { ArchiveTarget } from '../types/source'
import { uniqueName } from './fileNames'

export interface MockCopyRecord {
  folder: string
  savedAs: string
  size: number
}

export function createMockArchiveTarget(): { target: ArchiveTarget; records: MockCopyRecord[] } {
  const folders = new Map<string, Set<string>>()
  const records: MockCopyRecord[] = []

  const target: ArchiveTarget = {
    async copy(file, folderName) {
      let taken = folders.get(folderName)
      if (!taken) {
        taken = new Set()
        folders.set(folderName, taken)
      }
      const savedAs = uniqueName(file.name, taken)
      records.push({ folder: folderName, savedAs, size: file.size })
      return savedAs
    },
  }

  return { target, records }
}
