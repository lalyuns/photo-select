// 檢查畫面的照片格（Figma 11「照片列」「結果照片」）。
// 只畫「看得到的那幾列」，往下捲才畫下一批，3000 張也不會卡。
import { useEffect, useRef, useState } from 'react'
import type { ThumbnailCache } from '../../sources/thumbnails'
import type { Category } from '../../types/model'
import type { PhotoEntry } from '../../types/source'
import styles from './Review.module.css'

// Figma：卡片 270 × 199，左右間距 16，上下間距 18
const CARD_MIN_W = 250
const CARD_H = 199
const GAP_X = 16
const GAP_Y = 18
const ROW_H = CARD_H + GAP_Y
const OVERSCAN = 2 // 上下多畫兩列，捲動時不會看到空白

interface Props {
  photos: PhotoEntry[]
  assignments: Record<string, string>
  categories: Category[]
  thumbs: ThumbnailCache | null
  onOpen(photo: PhotoEntry): void
}

export function PhotoGrid({ photos, assignments, categories, thumbs, onOpen }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const cols = Math.max(1, Math.floor((size.width + GAP_X) / (CARD_MIN_W + GAP_X)))
  const cardW = (size.width - GAP_X * (cols - 1)) / cols
  const rows = Math.ceil(photos.length / cols)
  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN)
  const lastRow = Math.min(rows, Math.ceil((scrollTop + size.height) / ROW_H) + OVERSCAN)

  const byId = new Map(categories.map((c) => [c.id, c]))
  const visible: { photo: PhotoEntry; index: number }[] = []
  for (let i = firstRow * cols; i < Math.min(photos.length, lastRow * cols); i++) visible.push({ photo: photos[i], index: i })

  return (
    <div ref={scrollerRef} className={styles.scroller} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ position: 'relative', height: Math.max(0, rows * ROW_H - GAP_Y) }}>
        {size.width > 0 &&
          visible.map(({ photo, index }) => {
            const category = byId.get(assignments[photo.id])
            return (
              <button
                key={photo.id}
                type="button"
                className={styles.card}
                style={{
                  left: (index % cols) * (cardW + GAP_X),
                  top: Math.floor(index / cols) * ROW_H,
                  width: cardW,
                  height: CARD_H,
                }}
                onClick={() => onOpen(photo)}
                aria-label={`${photo.name}：${category?.name ?? '未分類'}，點一下改分類`}
              >
                <Thumb thumbs={thumbs} id={photo.id} />
                <span className={styles.cardName}>{photo.name}</span>
                <span className={styles.cardCategory}>
                  <i style={{ background: category?.color ?? 'transparent', borderColor: category ? 'transparent' : 'var(--ink-subtle)' }} />
                  {category?.name ?? '未分類'}
                </span>
              </button>
            )
          })}
      </div>
    </div>
  )
}

function Thumb({ thumbs, id }: { thumbs: ThumbnailCache | null; id: string }) {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    if (!thumbs) return
    let cancelled = false
    thumbs.get(id).then(
      (url) => !cancelled && setLoaded({ id, url }),
      (e: Error) => !cancelled && e.message !== 'disposed' && setFailed(id),
    )
    return () => {
      cancelled = true
    }
  }, [thumbs, id])

  if (failed === id) return <span className={`${styles.thumb} ${styles.thumbBroken}`}>讀不到</span>
  return loaded?.id === id
    ? <img className={styles.thumb} src={loaded.url} alt="" />
    : <span className={styles.thumb} />
}
