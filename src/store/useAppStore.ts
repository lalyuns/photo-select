// 全 App 共用的狀態倉庫：資料放這裡，改資料的動作也放這裡。
import { create } from 'zustand'
import type { PhotoEntry, PhotoSource } from '../types/source'
import type { AppState, Category, Screen } from '../types/model'

// 預設三類；顏色來自 Figma 色點
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'keep', name: '保留', key: 'Digit1', color: '#28B946', folderName: '保留' },
  { id: 'delete', name: '刪除', key: 'Digit2', color: '#FF3B30', folderName: '待刪除' },
  { id: 'maybe', name: '待考慮', key: 'Digit3', color: '#FF9500', folderName: '待考慮' },
]

/** 把 n 限制在 0 到 max 之間 */
const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max))

interface AppActions {
  goTo(screen: Screen): void
  /** 載入一批新照片，清空之前的分類與撤回紀錄 */
  loadPhotos(source: PhotoSource, photos: PhotoEntry[]): void
  setCategories(categories: Category[]): void
  /** 把目前這張分到某類，並跳下一張 */
  assign(categoryId: string): void
  /** 在檢查畫面改某張的分類（不跳張，但可以撤回） */
  reassign(photoId: string, categoryId: string): void
  /** 撤回上一筆分類 */
  undo(): void
  next(): void
  prev(): void
  jumpTo(index: number): void
}

export const useAppStore = create<AppState & AppActions>()((set, get) => ({
  // ---- 初始狀態 ----
  screen: 'start',
  source: null,
  sourceLabel: '',
  photos: [],
  categories: DEFAULT_CATEGORIES,
  assignments: {},
  history: [],
  cursor: 0,

  // ---- 動作 ----
  goTo: (screen) => set({ screen }),

  loadPhotos: (source, photos) =>
    set({ source, sourceLabel: source.label, photos, assignments: {}, history: [], cursor: 0 }),

  setCategories: (categories) => set({ categories }),

  assign: (categoryId) => {
    const { photos, cursor, assignments, history } = get()
    const photo = photos[cursor]
    if (!photo) return
    set({
      assignments: { ...assignments, [photo.id]: categoryId },
      history: [...history, { photoId: photo.id, prev: assignments[photo.id], next: categoryId, cursor }],
      cursor: clamp(cursor + 1, photos.length - 1),
    })
  },

  reassign: (photoId, categoryId) => {
    const { assignments, history, cursor } = get()
    set({
      assignments: { ...assignments, [photoId]: categoryId },
      history: [...history, { photoId, prev: assignments[photoId], next: categoryId, cursor }],
    })
  },

  undo: () => {
    const { history, assignments } = get()
    const last = history.at(-1)
    if (!last) return
    const restored = { ...assignments }
    if (last.prev === undefined) delete restored[last.photoId]
    else restored[last.photoId] = last.prev
    set({ assignments: restored, history: history.slice(0, -1), cursor: last.cursor })
  },

  next: () => set((s) => ({ cursor: clamp(s.cursor + 1, s.photos.length - 1) })),
  prev: () => set((s) => ({ cursor: clamp(s.cursor - 1, s.photos.length - 1) })),
  jumpTo: (index) => set((s) => ({ cursor: clamp(index, s.photos.length - 1) })),
}))
