// 整理進度的自動存檔與接續（企劃 M4：分到第 1,200 張時分頁當掉，重新開啟可以接著做）。
// 只存分類結果（檔名 → 分類），不存照片本身。
import { idbDelete, idbGet, idbSet } from './idb'

const KEY = 'progress'

export interface SavedProgress {
  savedAt: number
  kind: 'folder' | 'demo'
  // 真的資料夾不存 handle：無痕視窗裡把 handle 存進 IndexedDB 可能讓分頁當掉。
  // 接續時請使用者再選一次同一個資料夾（Chrome 會直接開在上次的位置）。
  /** 示範相冊：存相冊 id */
  albumId?: string
  label: string
  photoCount: number
  assigned: number
  cursor: number
  /** 檔名 → 分類 id；另外記檔案大小與修改時間，確認是同一張照片 */
  assignments: Record<string, string>
  fingerprints: Record<string, string>
}

export const loadProgress = () => idbGet<SavedProgress>(KEY).catch(() => undefined)
export const saveProgress = (progress: SavedProgress) => idbSet(KEY, progress).catch(() => {})
export const clearProgress = () => idbDelete(KEY).catch(() => {})
