// 整理和檢查時，分類一有變動就（稍微延遲後）把進度存進 IndexedDB；歸檔完成就清掉。
import { useEffect } from 'react'
import { clearProgress, saveProgress } from '../sources/progress'
import { useAppStore } from '../store/useAppStore'

const DELAY = 800

export function useAutoSave() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const unsubscribe = useAppStore.subscribe((state, prev) => {
      // 歸檔完成（不是中途停止）→ 這一批結束了，不需要接續
      if (state.lastArchive && state.lastArchive !== prev.lastArchive && !state.lastArchive.stopped) {
        clearTimeout(timer)
        void clearProgress()
        return
      }
      if (state.assignments === prev.assignments && state.cursor === prev.cursor) return
      if (state.screen !== 'sort' && state.screen !== 'review') return
      const { source, photos, assignments, cursor, sourceLabel } = state
      if (!source || Object.keys(assignments).length === 0) return

      clearTimeout(timer)
      timer = setTimeout(() => {
        const fingerprints: Record<string, string> = {}
        for (const p of photos) if (assignments[p.id]) fingerprints[p.id] = `${p.size}:${p.lastModified}`
        void saveProgress({
          savedAt: Date.now(),
          kind: 'albumId' in source ? 'demo' : 'folder',
          albumId: 'albumId' in source ? String(source.albumId) : undefined,
          label: sourceLabel,
          photoCount: photos.length,
          assigned: Object.keys(assignments).length,
          cursor,
          assignments,
          fingerprints,
        })
      }, DELAY)
    })

    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])
}
