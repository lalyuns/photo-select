// PhotoSource 的示範版：從 public/demo/ 讀照片，不碰使用者的檔案。
import type { PhotoEntry, PhotoSource, ScanResult } from '../types/source'
import { demoUrl, type DemoAlbum } from './demoAlbums'
import { summarizeNames } from './fileNames'

export function createMockPhotoSource(album: DemoAlbum): PhotoSource {
  return {
    label: album.label,

    async scan(): Promise<ScanResult> {
      const { supported, unsupported } = summarizeNames(album.files)
      const photos: PhotoEntry[] = supported.map((name) => ({
        id: name,
        name,
        size: 0,          // 示範照片不先下載，大小未知
        lastModified: 0,
      }))
      return { photos, unsupported }
    },

    async getFile(id: string): Promise<File> {
      const res = await fetch(demoUrl(id))
      if (!res.ok) throw new Error(`找不到示範照片 public/demo/${id}`)
      const blob = await res.blob()
      return new File([blob], id, { type: blob.type })
    },
  }
}
