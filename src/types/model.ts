// App 裡所有資料的「長相」。只有型別，沒有邏輯。
import type { PhotoEntry, PhotoSource } from './source'

/** 目前顯示哪個畫面（對應設計稿 A 選資料夾、B 設定、C 整理、D 檢查、完成） */
export type Screen = 'start' | 'setup' | 'sort' | 'review' | 'done'

/** 一個分類 */
export interface Category {
  id: string
  /** 顯示名稱，例如「朋友美照」 */
  name: string
  /** 快捷鍵，一律存 KeyboardEvent.code，例如 'Digit1'、'KeyF' */
  key: string
  /** 色點顏色，例如 '#34C759' */
  color: string
  /** 歸檔時的資料夾名稱（「刪除」對應「待刪除」） */
  folderName: string
}

/** 一筆分類操作，撤回時用 */
export interface HistoryEntry {
  photoId: string
  /** 這次操作之前的分類；原本沒分過就是 undefined */
  prev?: string
  /** 這次分到的分類 */
  next: string
  /** 操作當下停在第幾張，撤回時跳回這裡 */
  cursor: number
}

/** 整個 App 的狀態 */
export interface AppState {
  screen: Screen
  /** 目前這批照片的來源（示範相冊或真資料夾）；不會存進瀏覽器 */
  source: PhotoSource | null
  /** 相冊名稱，顯示在左上角 */
  sourceLabel: string
  photos: PhotoEntry[]
  /** 掃描時跳過的不支援格式，例如 { heic: 412, raw: 800 }（H6 的數據） */
  unsupported: Record<string, number>
  categories: Category[]
  /** 照片 id → 分類 id；沒分過的照片不會出現在這裡 */
  assignments: Record<string, string>
  history: HistoryEntry[]
  /** 目前看第幾張，從 0 開始 */
  cursor: number
}
