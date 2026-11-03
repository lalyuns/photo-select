// ArchiveTarget 的真實版：把照片「複製」到使用者選的資料夾底下的分類資料夾。原檔不動。
import type { ArchiveTarget } from '../types/source'
import { uniqueName } from './fileNames'

interface Folder {
  handle: FileSystemDirectoryHandle
  /** 這個資料夾裡已經有的檔名（小寫），用來避免覆蓋 */
  taken: Set<string>
}

export interface DirectoryArchiveTarget extends ArchiveTarget {
  readonly handle: FileSystemDirectoryHandle
}

export function createDirectoryArchiveTarget(root: FileSystemDirectoryHandle): DirectoryArchiveTarget {
  // 同一個分類資料夾只開一次、只列一次檔名。存 Promise 是為了讓同時複製的多張照片共用同一次準備
  const folders = new Map<string, Promise<Folder>>()

  function openFolder(name: string): Promise<Folder> {
    let folder = folders.get(name)
    if (!folder) {
      folder = (async () => {
        const handle = await root.getDirectoryHandle(name, { create: true })
        const taken = new Set<string>()
        for await (const existing of handle.keys()) taken.add(existing.toLowerCase())
        return { handle, taken }
      })()
      folders.set(name, folder)
    }
    return folder
  }

  return {
    handle: root,

    async copy(file: File, folderName: string): Promise<string> {
      const folder = await openFolder(folderName)
      // 先佔用名字再寫檔：同時複製兩張同名照片也不會撞名
      const savedAs = uniqueName(file.name, folder.taken)
      try {
        const target = await folder.handle.getFileHandle(savedAs, { create: true })
        const writable = await target.createWritable()
        // 用串流複製，不會把整個檔案讀進記憶體。中途失敗時 Chrome 會丟掉暫存檔
        await file.stream().pipeTo(writable)
        return savedAs
      } catch (e) {
        folder.taken.delete(savedAs.toLowerCase())
        // 寫到一半失敗時清掉空檔案；清不掉也沒關係
        await folder.handle.removeEntry(savedAs).catch(() => {})
        throw e
      }
    },
  }
}
