// 設定表格的「快捷鍵」欄（Figma「快捷鍵 1」）：平常顯示「更改 [1]」，點一下進入等待按鍵。
import { Keycap } from '../ui/Keycap'
import styles from './Setup.module.css'

interface Props {
  code: string
  capturing: boolean
  onStart(): void
  onStop(): void
}

export function KeyField({ code, capturing, onStart, onStop }: Props) {
  return (
    <button
      type="button"
      className={`${styles.field} ${styles.keyField} ${capturing ? styles.capturing : ''}`}
      onClick={capturing ? onStop : onStart}
      onBlur={() => capturing && onStop()}
      aria-label={capturing ? '請按下新的快捷鍵，Esc 取消' : '更改快捷鍵'}
    >
      <span className={styles.keyHint}>{capturing ? '按下新按鍵…' : '更改'}</span>
      <Keycap code={code} />
    </button>
  )
}
