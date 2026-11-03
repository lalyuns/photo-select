// 全 App 共用的狀態倉庫：資料放這裡，改資料的動作也放這裡。
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PhotoEntry, PhotoSource } from '../types/source'
import { logEvent } from '../research/eventLog'
import type { AppState, ArchiveSummary, Category, Screen } from '../types/model'

// 預設三類；顏色來自 Figma 色點
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'keep', name: '保留', key: 'Digit1', color: '#28B946', folderName: '保留' },
  { id: 'delete', name: '刪除', key: 'Digit2', color: '#FF3B30', folderName: '待刪除' },
  { id: 'maybe', name: '待考慮', key: 'Digit3', color: '#FF9500', folderName: '待考慮' },
]

/** 不是預設三類的分類有幾個 */
const countCustom = (categories: Category[]) =>
  categories.filter((c) => !DEFAULT_CATEGORIES.some((d) => d.id === c.id)).length

/** 把 n 限制在 0 到 max 之間 */
const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max))

interface AppActions {
  goTo(screen: Screen): void
  /** 載入一批新照片，清空之前的分類與撤回紀錄 */
  loadPhotos(source: PhotoSource, photos: PhotoEntry[], unsupported?: Record<string, number>): void
  /**
   * 換成新的分類設定。被移除的分類，已分進去的照片會變回未分類，
   * 撤回紀錄也會清空（避免撤回到一個不存在的分類）。
   */
  setCategories(categories: Category[]): void
  /** 把目前這張分到某類，並跳下一張 */
  assign(categoryId: string): void
  /** 在檢查畫面改某張的分類（不跳張，但可以撤回） */
  reassign(photoId: string, categoryId: string): void
  /** 撤回上一筆分類 */
  undo(): void
  setArchiveResult(summary: ArchiveSummary): void
  /** 接續上次的進度：只還原這批照片裡還在、而且分類還存在的部分 */
  restoreProgress(assignments: Record<string, string>, cursor: number): number
  next(): void
  prev(): void
  jumpTo(index: number): void
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
  // ---- 初始狀態 ----
  screen: 'start',
  prevScreen: 'start',
  source: null,
  sourceLabel: '',
  photos: [],
  unsupported: {},
  categories: DEFAULT_CATEGORIES,
  assignments: {},
  history: [],
  cursor: 0,
  lastArchive: null,

  // ---- 動作 ----
  goTo: (screen) => {
    const from = get().screen
    logEvent('screen', { from, to: screen })
    set({ screen, prevScreen: from })
  },

  loadPhotos: (source, photos, unsupported = {}) => {
    logEvent('session', { source: 'albumId' in source ? 'demo' : 'folder', photoCount: photos.length, unsupported })
    set({ source, sourceLabel: source.label, photos, unsupported, assignments: {}, history: [], cursor: 0, lastArchive: null })
  },

  setArchiveResult: (summary) => set({ lastArchive: summary }),

  restoreProgress: (saved, cursor) => {
    const { photos, categories } = get()
    const ids = new Set(photos.map((p) => p.id))
    const alive = new Set(categories.map((c) => c.id))
    const assignments = Object.fromEntries(Object.entries(saved).filter(([id, c]) => ids.has(id) && alive.has(c)))
    logEvent('resume', { restored: Object.keys(assignments).length })
    set({ assignments, history: [], cursor: clamp(cursor, photos.length - 1) })
    return Object.keys(assignments).length
  },

  setCategories: (categories) => {
    const { assignments, history } = get()
    logEvent('categories', { count: categories.length, custom: countCustom(categories) })
    const alive = new Set(categories.map((c) => c.id))
    const removed = Object.values(assignments).some((id) => !alive.has(id))
    if (!removed) {
      set({ categories })
      return
    }
    const kept = Object.fromEntries(Object.entries(assignments).filter(([, id]) => alive.has(id)))
    set({ categories, assignments: kept, history: history.length ? [] : history })
  },

  assign: (categoryId) => {
    const { photos, cursor, assignments, history } = get()
    const photo = photos[cursor]
    if (!photo) return
    const { categories } = get()
    logEvent('assign', {
      index: cursor,
      category: categoryId,
      name: categories.find((c) => c.id === categoryId)?.name,
      custom: countCustom(categories) > 0, // H7：有自訂分類時還按不按「保留」
    })
    set({
      assignments: { ...assignments, [photo.id]: categoryId },
      history: [...history, { photoId: photo.id, prev: assignments[photo.id], next: categoryId, cursor }],
      cursor: clamp(cursor + 1, photos.length - 1),
    })
  },

  reassign: (photoId, categoryId) => {
    const { assignments, history, cursor } = get()
    logEvent('reassign', { from: assignments[photoId] ?? null, to: categoryId })
    set({
      assignments: { ...assignments, [photoId]: categoryId },
      history: [...history, { photoId, prev: assignments[photoId], next: categoryId, cursor }],
    })
  },

  undo: () => {
    const { history, assignments } = get()
    const last = history.at(-1)
    if (!last) return
    logEvent('undo', { index: last.cursor })
    const restored = { ...assignments }
    if (last.prev === undefined) delete restored[last.photoId]
    else restored[last.photoId] = last.prev
    set({ assignments: restored, history: history.slice(0, -1), cursor: last.cursor })
  },

  next: () => set((s) => ({ cursor: clamp(s.cursor + 1, s.photos.length - 1) })),
  prev: () => set((s) => ({ cursor: clamp(s.cursor - 1, s.photos.length - 1) })),
  jumpTo: (index) => set((s) => ({ cursor: clamp(index, s.photos.length - 1) })),
    }),
    {
      // 只把「分類設定」存進瀏覽器，下次打開還在（企劃 C4：設定可沿用）
      name: 'photo-select:settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ categories: s.categories }),
    },
  ),
)
