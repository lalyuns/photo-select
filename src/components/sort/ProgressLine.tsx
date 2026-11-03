// 頂端進度線（Figma「進度線（顏色＝分類）」）：每張照片一小段，顏色＝它的分類。
// 用 canvas 畫，三千張也只是一次繪圖，不會產生三千個元素。點一下可以跳到那一張。
import { useEffect, useRef } from 'react'
import type { Category } from '../../types/model'
import type { PhotoEntry } from '../../types/source'
import styles from './ProgressLine.module.css'

interface Props {
  photos: PhotoEntry[]
  assignments: Record<string, string>
  categories: Category[]
  cursor: number
  onJump(index: number): void
}

const CURRENT = '#26292B'
const PENDING = 'rgba(28, 28, 32, 0.22)'

export function ProgressLine({ photos, assignments, categories, cursor, onJump }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const colorOf = new Map(categories.map((c) => [c.id, c.color]))

    function draw() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      const n = photos.length
      if (n === 0) return
      const slot = width / n
      const gap = slot > 8 ? 2 : 0 // 照片很多時段落太細，就不留空隙
      const thin = 3 // 一般段落 3px（Figma），目前這張用整個高度凸出來
      photos.forEach((photo, i) => {
        const color = colorOf.get(assignments[photo.id])
        const isCurrent = i === cursor
        // 已分類就用分類色（目前這張也是）；目前這張還沒分類時用深灰
        ctx.fillStyle = color ?? (isCurrent ? CURRENT : PENDING)
        const x = i * slot
        const w = Math.max(slot - gap, 1)
        const h = isCurrent ? height : thin
        ctx.beginPath()
        ctx.roundRect(x, (height - h) / 2, w, h, Math.min(2, w / 2))
        ctx.fill()
      })
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [photos, assignments, categories, cursor])

  // 線只有 3px 高不好點，外面包一層比較高的透明區域負責接點擊
  return (
    <div
      className={styles.hit}
      onClick={(e) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect || photos.length === 0) return
        const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 0.9999)
        onJump(Math.floor(ratio * photos.length))
      }}
    >
      <canvas
        ref={canvasRef}
        className={styles.line}
        role="progressbar"
        aria-label="整理進度"
        aria-valuemin={1}
        aria-valuemax={photos.length}
        aria-valuenow={cursor + 1}
      />
    </div>
  )
}
