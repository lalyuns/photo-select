// 每個畫面共用的背景：照片放大模糊 + 一層白色淡化（Figma「環境光」與「日間淡化」）。
import type { ReactNode } from 'react'
import styles from './Ambient.module.css'

interface Props {
  /** 背景用的照片網址；沒有就只顯示柔和漸層 */
  photo?: string | null
  children: ReactNode
}

export function Ambient({ photo, children }: Props) {
  return (
    <div className={styles.root}>
      {photo && <div className={styles.photo} style={{ backgroundImage: `url("${photo}")` }} />}
      <div className={styles.veil} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
