// 還沒做的畫面先用這個佔位：寫明由哪條軌道負責、對應 Figma 哪幾張，並放上前後畫面的按鈕，
// 讓整個流程現在就能點過一遍。各軌道做正式畫面時，把整個佔位換掉即可。
import type { ReactNode } from 'react'
import { Ambient } from '../components/Ambient'
import styles from './Placeholder.module.css'

interface Props {
  title: string
  track: string
  figma: string
  photo?: string | null
  actions: ReactNode
  children?: ReactNode
}

export function Placeholder({ title, track, figma, photo, actions, children }: Props) {
  return (
    <Ambient photo={photo}>
      <main className={styles.page}>
        <section className={`glass-panel ${styles.panel}`}>
          <p className={styles.tag}>{track}・Figma {figma}</p>
          <h1 className={styles.title}>{title}</h1>
          {children}
          <div className={styles.actions}>{actions}</div>
        </section>
      </main>
    </Ambient>
  )
}
