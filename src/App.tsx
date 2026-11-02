// 暫時的展示頁：確認 0-3 狀態、0-4 按鍵、0-5 樣式、0-6 Mock 能一起運作。
// 之後會換成依 screen 切換 A／B／C／D 畫面。
import { useEffect, useState } from 'react'
import { Button } from './components/ui/Button'
import { Keycap } from './components/ui/Keycap'
import { glowOf } from './config/categoryColors'
import { resolveKey } from './config/keys'
import { DEMO_ALBUMS, type DemoAlbum } from './sources/demoAlbums'
import { createMockPhotoSource } from './sources/MockPhotoSource'
import { useAppStore } from './store/useAppStore'
import type { PhotoSource, ScanResult } from './types/source'

export default function App() {
  const categories = useAppStore((s) => s.categories)
  const photos = useAppStore((s) => s.photos)
  const cursor = useAppStore((s) => s.cursor)
  const assignments = useAppStore((s) => s.assignments)
  const sourceLabel = useAppStore((s) => s.sourceLabel)
  const loadPhotos = useAppStore((s) => s.loadPhotos)

  const [scans, setScans] = useState<{ album: DemoAlbum; result: ScanResult }[]>([])
  const [source, setSource] = useState<PhotoSource | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState('')

  // 一打開就掃描所有示範相冊
  useEffect(() => {
    Promise.all(
      DEMO_ALBUMS.map(async (album) => ({
        album,
        result: await createMockPhotoSource(album).scan(),
      })),
    ).then(setScans)
  }, [])

  // 目前第幾張（cursor）一變，就載入那一張
  useEffect(() => {
    const photo = photos[cursor]
    if (!source || !photo) {
      setPreview(null)
      return
    }
    let cancelled = false
    let url: string | null = null
    source
      .getFile(photo.id)
      .then((file) => {
        if (cancelled) return
        url = URL.createObjectURL(file)
        setPreview(url)
        setError(null)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url) // 換張時釋放上一張，避免記憶體越用越多
    }
  }, [source, photos, cursor])

  // 鍵盤：交給 resolveKey 翻譯成動作，再呼叫 store
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
      setLastAction(action.type === 'assign' ? `assign → ${action.categoryId}` : action.type)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function openAlbum(album: DemoAlbum) {
    const src = createMockPhotoSource(album)
    const { photos } = await src.scan()
    loadPhotos(src.label, photos)
    setSource(src)
    setLastAction('')
    // 讓剛按的相冊按鈕失去焦點，不然按空白鍵會再點一次按鈕
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const nameOf = (id?: string) => categories.find((c) => c.id === id)?.name ?? '未分類'
  const colorOf = (id?: string) => categories.find((c) => c.id === id)?.color ?? 'transparent'
  const current = photos[cursor]

  return (
    <main
      style={{
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 40,
        background: 'linear-gradient(135deg, #eadfe6, #dde6ee)',
      }}
    >
      <div className="glass-panel" style={{ padding: 28, display: 'grid', gap: 24, maxWidth: 740 }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>元件展示</h1>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <Button variant="primary">開始整理</Button>
          <Button size="md">返回</Button>
          <Button variant="primary" size="sm">檢查結果</Button>
          <Button variant="ghost" size="sm">分類設定</Button>
          <Button variant="ghost" size="sm" disabled>
            撤回 <Keycap code="KeyZ" label="⌘Z" />
          </Button>
        </section>

        <nav
          className="glass"
          style={{ display: 'flex', gap: 4, padding: 5, borderRadius: 'var(--radius-tray)', width: 'fit-content' }}
        >
          {categories.map((c) => (
            <span
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                minHeight: 42,
                padding: '0 16px 0 10px',
                fontSize: 'var(--text-md)',
                fontWeight: 700,
              }}
            >
              <i
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: c.color,
                  boxShadow: `0 0 10px ${glowOf(c.color)}B3`,
                }}
              />
              <Keycap code={c.key} />
              {c.name}
            </span>
          ))}
        </nav>

        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>示範相冊（Mock）</h2>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {scans.map(({ album, result }) => {
            const skipped = Object.values(result.unsupported).reduce((a, b) => a + b, 0)
            return (
              <Button key={album.id} size="md" onClick={() => openAlbum(album)}>
                {album.label}・{result.photos.length} 張
                {skipped > 0 && `（${skipped} 個不支援）`}
              </Button>
            )
          })}
        </section>

        {sourceLabel && (
          <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
            <b>{sourceLabel}</b>　{photos.length ? `${cursor + 1} / ${photos.length}` : '沒有支援的照片'}
            {current && `　${current.name}　目前分類：${nameOf(assignments[current.id])}`}
            {lastAction && <span style={{ color: 'var(--ink-subtle)' }}>　上一個動作：{lastAction}</span>}
          </p>
        )}

        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 2 }}>
            {photos.map((p, i) => (
              <span
                key={p.id}
                title={`${p.name}：${nameOf(assignments[p.id])}`}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 'var(--radius-progress)',
                  background: assignments[p.id] ? colorOf(assignments[p.id]) : 'var(--fill-keycap)',
                  outline: i === cursor ? '2px solid var(--ink)' : 'none',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        )}

        {error && <p style={{ margin: 0, color: '#FF3B30' }}>{error}</p>}
        {preview && (
          <img
            src={preview}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: 360,
              objectFit: 'contain',
              borderRadius: 'var(--radius-photo)',
              boxShadow: 'var(--shadow-photo)',
            }}
          />
        )}
        <p style={{ margin: 0, color: 'var(--ink-subtle)', fontSize: 'var(--text-sm)' }}>
          測試：← → 換張　1／2／3 分類並跳下一張　Z 或 ⌘Z 撤回
        </p>
      </div>
    </main>
  )
}
