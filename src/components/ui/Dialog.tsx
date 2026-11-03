// 共用對話框（Figma 的「說明｜…」「提示｜…」「確認｜…」「放大｜…」）。
// 開啟時焦點移到第一個按鈕；Esc 關閉；按鍵不會漏到外面的分類快捷鍵。
import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Dialog.module.css'

interface Props {
  open: boolean
  /** 標題；不放標題時要給 label，讓螢幕閱讀器知道這是什麼 */
  title?: string
  label?: string
  onClose(): void
  children?: ReactNode
  /** 底部按鈕，照 Figma 由上往下排 */
  actions: ReactNode
  /** wide：放大照片用，幾乎佔滿畫面 */
  size?: 'default' | 'wide'
}

export function Dialog({ open, title, label, onClose, children, actions, size = 'default' }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('button')?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        className={`glass-panel ${styles.panel} ${size === 'wide' ? styles.wide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') onClose()
        }}
      >
        {title && <h2 id={titleId} className={styles.title}>{title}</h2>}
        {children && <div className={styles.body}>{children}</div>}
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>
  )
}
