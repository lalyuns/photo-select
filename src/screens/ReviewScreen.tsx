// 畫面 D：檢查結果（Figma 11、12、修改分類｜照片、確認｜歸檔方式）
// 最後看一眼每張照片分到哪裡，可以點照片改分類，確認後歸檔。
import { useEffect, useMemo, useState } from 'react'
import { Ambient } from '../components/Ambient'
import { PhotoGrid } from '../components/review/PhotoGrid'
import { ReassignDialog } from '../components/review/ReassignDialog'
import styles from '../components/review/Review.module.css'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { useArchiveFlow } from '../hooks/useArchiveFlow'
import { usePhotoUrl } from '../hooks/usePhotoUrl'
import { createThumbnailCache } from '../sources/thumbnails'
import { useAppStore } from '../store/useAppStore'
import type { PhotoEntry } from '../types/source'

const UNSORTED = '__unsorted__'

export function ReviewScreen() {
  const source = useAppStore((s) => s.source)
  const photos = useAppStore((s) => s.photos)
  const categories = useAppStore((s) => s.categories)
  const assignments = useAppStore((s) => s.assignments)
  const { reassign, goTo } = useAppStore.getState()

  const thumbs = useMemo(() => (source ? createThumbnailCache(source) : null), [source])
  useEffect(() => () => thumbs?.dispose(), [thumbs])
  const backdrop = usePhotoUrl(source, photos[0]?.id)

  const [filter, setFilter] = useState<string | null>(null)
  const [editing, setEditing] = useState<PhotoEntry | null>(null)
  const archive = useArchiveFlow()

  // 每個分類有幾張
  const counts = new Map<string, number>()
  for (const p of photos) {
    const key = assignments[p.id] ?? UNSORTED
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const unsorted = counts.get(UNSORTED) ?? 0
  const assigned = photos.length - unsorted
  const shown = filter === null ? photos : photos.filter((p) => (assignments[p.id] ?? UNSORTED) === filter)
  const deleteFolder = categories.find((c) => c.id === 'delete')?.folderName

  return (
    <Ambient photo={backdrop.url}>
      <main className={styles.page}>
        <section className={`glass-panel ${styles.panel}`} aria-labelledby="review-title">
          <header className={styles.header}>
            <div>
              <h1 id="review-title">最後看一眼，再歸檔。</h1>
              <p>{photos.length} 張照片 · 點照片改分類</p>
            </div>
            <Button size="lg" className={styles.wideButton} onClick={() => goTo('sort')}>繼續整理</Button>
          </header>

          {/* 依分類篩選（Figma 沒有；照片多的時候才找得到想看的） */}
          <nav className={styles.filters} aria-label="依分類篩選">
            <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>
              全部 <b>{photos.length}</b>
            </button>
            {categories.map((c) => (
              <button key={c.id} type="button" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
                <i style={{ background: c.color }} />
                {c.name} <b>{counts.get(c.id) ?? 0}</b>
              </button>
            ))}
            {unsorted > 0 && (
              <button type="button" aria-pressed={filter === UNSORTED} onClick={() => setFilter(UNSORTED)}>
                <i className={styles.hollow} />
                未分類 <b>{unsorted}</b>
              </button>
            )}
          </nav>

          {shown.length > 0 ? (
            <PhotoGrid photos={shown} assignments={assignments} categories={categories} thumbs={thumbs} onOpen={setEditing} />
          ) : (
            <p className={styles.empty}>這個分類目前沒有照片。</p>
          )}

          <footer className={styles.footer}>
            <p>
              原始照片保留{deleteFolder ? `；「刪除」先歸入「${deleteFolder}」資料夾` : ''}。
              {unsorted > 0 && <strong>　還有 {unsorted} 張沒分類，不會複製。</strong>}
            </p>
            <Button variant="primary" className={styles.wideButton} onClick={archive.open} disabled={assigned === 0}>
              確認歸檔
            </Button>
          </footer>
        </section>
      </main>

      <ReassignDialog
        photo={editing}
        source={source}
        categories={categories}
        currentId={editing ? assignments[editing.id] : undefined}
        onPick={(id) => {
          if (editing) reassign(editing.id, id)
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />

      {/* Figma「確認｜歸檔方式」 */}
      <Dialog
        open={archive.phase === 'confirm'}
        title="確認歸檔"
        onClose={archive.close}
        actions={
          <>
            <Button variant="primary" onClick={archive.chooseTarget}>確認，選擇儲存位置</Button>
            <Button onClick={archive.close}>返回檢查</Button>
          </>
        }
      >
        <p>依分類複製 {assigned} 張到資料夾，原始照片保留。</p>
        {deleteFolder && <p>「刪除」先歸入「{deleteFolder}」資料夾，確認後再自己刪掉。</p>}
        {unsorted > 0 && <p className={styles.muted}>還有 {unsorted} 張沒分類，不會複製。</p>}
      </Dialog>

      <Dialog
        open={archive.phase === 'inside'}
        title="要存在照片資料夾裡面嗎？"
        onClose={archive.close}
        actions={
          <>
            <Button variant="primary" onClick={archive.chooseTarget}>換一個位置</Button>
            <Button onClick={archive.proceedInside}>仍要存在這裡</Button>
          </>
        }
      >
        <p>你選的位置在原本的照片資料夾裡面。下次整理這個資料夾時，會連複本一起讀進來。</p>
      </Dialog>

      <Dialog
        open={archive.phase === 'running'}
        title="歸檔中…"
        onClose={() => {}}
        actions={<Button onClick={archive.stop}>停止</Button>}
      >
        <progress className={styles.progress} max={archive.progress.total || 1} value={archive.progress.done} />
        <p className={styles.muted}>
          {archive.progress.done} / {archive.progress.total}
          {archive.progress.current && `　${archive.progress.current}`}
        </p>
      </Dialog>

      <Dialog
        open={archive.phase === 'failed'}
        title={`有 ${archive.summary?.failed.length ?? 0} 張沒有複製成功`}
        onClose={() => goTo('done')}
        actions={
          <>
            <Button variant="primary" onClick={archive.retryFailed}>重試這幾張</Button>
            <Button onClick={() => goTo('done')}>先看結果</Button>
          </>
        }
      >
        <ul className={styles.failures}>
          {archive.summary?.failed.slice(0, 8).map((f) => <li key={f.name}><b>{f.name}</b>：{f.reason}</li>)}
          {(archive.summary?.failed.length ?? 0) > 8 && <li>…還有 {(archive.summary?.failed.length ?? 0) - 8} 張</li>}
        </ul>
      </Dialog>

      <Dialog
        open={archive.phase === 'error'}
        title="沒辦法存到這裡"
        onClose={archive.close}
        actions={<Button variant="primary" onClick={archive.close}>返回檢查</Button>}
      >
        <p>{archive.error}</p>
      </Dialog>
    </Ambient>
  )
}
