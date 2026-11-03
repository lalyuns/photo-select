// 完成畫面（Figma 13「完成・示範結果」）：告訴使用者照片去了哪裡。
import { Ambient } from '../components/Ambient'
import styles from '../components/review/Review.module.css'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { usePhotoUrl } from '../hooks/usePhotoUrl'
import { useAppStore } from '../store/useAppStore'

export function DoneScreen() {
  const summary = useAppStore((s) => s.lastArchive)
  const source = useAppStore((s) => s.source)
  const photos = useAppStore((s) => s.photos)
  const goTo = useAppStore((s) => s.goTo)
  const categories = useAppStore((s) => s.categories)
  const backdrop = usePhotoUrl(source, photos[0]?.id)

  // 照分類設定的順序排，不是照複製完成的先後
  const order = categories.map((c) => c.folderName)
  const folders = Object.entries(summary?.byFolder ?? {}).sort(
    ([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99),
  )
  const title = summary?.stopped ? '已停止歸檔。' : '照片，各就各位。'

  return (
    <Ambient photo={backdrop.url}>
      <main className={styles.donePage}>
        <section className={`glass-panel ${styles.done}`} aria-labelledby="done-title">
          <h1 id="done-title">{title}</h1>
          {summary ? (
            <>
              <p className={styles.doneLead}>
                {summary.simulated ? '示範模式：' : ''}已複製 {summary.copied} 張到「{summary.targetName}」。
              </p>
              {folders.length > 0 && (
                <ul className={styles.folderList}>
                  {folders.map(([name, n]) => <li key={name}><span><Icon name="folder" size={16} /> {name}</span><b>{n} 張</b></li>)}
                </ul>
              )}
              <p className={styles.muted}>
                {summary.simulated ? '這個瀏覽器不能寫檔，所以沒有真的寫入；請用 Chrome 或 Edge。' : '原始照片都還在原處。'}
                {summary.skipped > 0 && ` ${summary.skipped} 張沒分類，沒有複製。`}
                {summary.failed.length > 0 && ` ${summary.failed.length} 張複製失敗。`}
              </p>
            </>
          ) : (
            <p className={styles.muted}>還沒有歸檔。</p>
          )}
          <div className={styles.doneActions}>
            <Button onClick={() => goTo('review')}>回看結果</Button>
            <Button variant="primary" onClick={() => goTo('start')}>再整理一組</Button>
          </div>
        </section>
      </main>
    </Ambient>
  )
}
