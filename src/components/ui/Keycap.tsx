import { keyLabel } from '../../config/keys'
import styles from './Keycap.module.css'

interface Props {
  /** KeyboardEvent.code，例如 'KeyF'、'Digit1' */
  code: string
  /** 想顯示別的字時用，例如 '⌘Z' */
  label?: string
}

/** 按鍵小方塊：分類托盤、設定表格、工具列、說明都會用到 */
export function Keycap({ code, label }: Props) {
  return <kbd className={styles.keycap}>{label ?? keyLabel(code)}</kbd>
}
