// 畫面 C：連續整理（Figma 04～10、放大｜照片 1～7）
// 負責：軌道 B。目前是佔位：已經接好鍵盤分類與撤回，可直接在這上面長出正式畫面。
import { useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { resolveKey } from '../config/keys'
import { usePhotoWindow } from '../hooks/usePhotoWindow'
import { useAppStore } from '../store/useAppStore'
import { Placeholder } from './Placeholder'

export function SortScreen() {
  const source = useAppStore((s) => s.source)
  const photos = useAppStore((s) => s.photos)
  const cursor = useAppStore((s) => s.cursor)
  const categories = useAppStore((s) => s.categories)
  const assignments = useAppStore((s) => s.assignments)
  const goTo = useAppStore((s) => s.goTo)

  const current = photos[cursor]
  const { url, error } = usePhotoWindow(source, photos, cursor)

  // 鍵盤：按鍵 → resolveKey → store 動作
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const { categories, assign, undo, next, prev } = useAppStore.getState()
      const action = resolveKey(e, categories)
      if (!action) return
      e.preventDefault()
      if (action.type === 'assign') assign(action.categoryId)
      if (action.type === 'undo') undo()
      if (action.type === 'next') next()
      if (action.type === 'prev') prev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const category = (id?: string) => categories.find((c) => c.id === id)

  return (
    <Placeholder
      title={`整理中 ${cursor + 1} / ${photos.length}`}
      track="軌道 B"
      figma="04～10"
      photo={url}
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={() => goTo('setup')}>分類設定</Button>
          <Button variant="primary" size="sm" onClick={() => goTo('review')}>檢查結果</Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 2 }}>
        {photos.map((p, i) => (
          <span
            key={p.id}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 'var(--radius-progress)',
              background: category(assignments[p.id])?.color ?? 'var(--fill-keycap)',
              outline: i === cursor ? '2px solid var(--ink)' : 'none',
              outlineOffset: 1,
            }}
          />
        ))}
      </div>
      {error && <p style={{ margin: 0, color: '#FF3B30' }}>{error}</p>}
      {url && (
        <img
          src={url}
          alt={current?.name}
          style={{ maxWidth: '100%', maxHeight: '50vh', justifySelf: 'center', borderRadius: 'var(--radius-photo)', boxShadow: 'var(--shadow-photo)' }}
        />
      )}
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--ink-subtle)' }}>
        {current?.name}・目前分類：{category(assignments[current?.id ?? ''])?.name ?? '未分類'}
        　｜　← → 換張　分類鍵分類並跳下一張　Z／⌘Z 撤回
      </p>
    </Placeholder>
  )
}
