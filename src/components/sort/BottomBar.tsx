// 底部列（Figma「底部列」）：左邊分類托盤，右邊導覽。按鍵和點擊都能用。
import type { CSSProperties } from 'react'
import { glowOf } from '../../config/categoryColors'
import type { Category } from '../../types/model'
import { Keycap } from '../ui/Keycap'
import styles from './BottomBar.module.css'

interface Props {
  categories: Category[]
  /** 目前這張的分類，對應的按鈕會亮起來 */
  activeId?: string
  /** 剛剛按下的分類，閃一下當作回饋 */
  flashId?: string | null
  canPrev: boolean
  canNext: boolean
  onAssign(categoryId: string): void
  onPrev(): void
  onNext(): void
  onZoom(): void
  onHelp(): void
}

export function BottomBar(props: Props) {
  const { categories, activeId, flashId, canPrev, canNext } = props
  return (
    <div className={styles.bar}>
      <div className={`glass ${styles.tray}`} role="group" aria-label="分類">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={[styles.chip, c.id === activeId && styles.active, c.id === flashId && styles.flash]
              .filter(Boolean)
              .join(' ')}
            onClick={() => props.onAssign(c.id)}
            aria-pressed={c.id === activeId}
            style={{ '--chip-color': c.color } as CSSProperties}
          >
            <i className={styles.dot} style={{ background: c.color, boxShadow: `0 0 10px ${glowOf(c.color)}B3` }} />
            <Keycap code={c.key} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <div className={`glass ${styles.nav}`}>
        <button type="button" className={styles.navItem} onClick={props.onPrev} disabled={!canPrev} aria-label="上一張">
          <Keycap code="ArrowLeft" />
        </button>
        <button type="button" className={styles.navItem} onClick={props.onNext} disabled={!canNext} aria-label="下一張">
          <Keycap code="ArrowRight" />
        </button>
        <button type="button" className={styles.navItem} onClick={props.onZoom}>
          <Keycap code="Space" />
          <span className={styles.navLabel}>放大</span>
        </button>
        <button type="button" className={styles.navItem} onClick={props.onHelp} aria-label="快捷鍵說明">
          <Keycap code="Slash" />
        </button>
      </div>
    </div>
  )
}
