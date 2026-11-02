// 暫時的展示頁：確認 0-5 的樣式與 0-6 的 Mock 都正常。
// 之後會換成依 screen 切換 A／B／C／D 畫面。
import { useEffect, useState } from 'react'
import { Button } from './components/ui/Button'
import { Keycap } from './components/ui/Keycap'
import { glowOf } from './config/categoryColors'
import { DEMO_ALBUMS, type DemoAlbum } from './sources/demoAlbums'
import { createMockPhotoSource } from './sources/MockPhotoSource'
import { useAppStore } from './store/useAppStore'
import type { ScanResult } from './types/source'

export default function App() {
  const categories = useAppStore((s) => s.categories)
  const photos = useAppStore((s) => s.photos)
  const sourceLabel = useAppStore((s) => s.sourceLabel)
  const loadPhotos = useAppStore((s) => s.loadPhotos)

  const [scans, setScans] = useState<{ album: DemoAlbum; result: ScanResult }[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 一打開就掃描所有示範相冊
  useEffect(() => {
    Promise.all(
      DEMO_ALBUMS.map(async (album) => ({
        album,
        result: await createMockPhotoSource(album).scan(),
      })),
    ).then(setScans)
  }, [])

  async function openAlbum(album: DemoAlbum) {
    const source = createMockPhotoSource(album)
    const { photos } = await source.scan()
    loadPhotos(source.label, photos)
    setError(null)
    if (!photos[0]) {
      setPreview(null)
      return
    }
    try {
      const file = await source.getFile(photos[0].id)
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(file)
      })
    } catch (e) {
      setPreview(null)
      setError((e as Error).message)
    }
  }

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
          <p style={{ margin: 0, color: 'var(--ink-subtle)', fontSize: 'var(--text-sm)' }}>
            已載入「{sourceLabel}」，共 {photos.length} 張：{photos.map((p) => p.name).join('、') || '沒有支援的照片'}
          </p>
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
      </div>
    </main>
  )
}
