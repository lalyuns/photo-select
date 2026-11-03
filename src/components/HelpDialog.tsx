// 快捷鍵說明（Figma「說明｜快捷鍵與原型範圍」）。首頁和整理畫面共用；分類鍵依目前設定產生。
import { useEffect } from 'react'
import { logEvent } from '../research/eventLog'
import { useAppStore } from '../store/useAppStore'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import { Keycap } from './ui/Keycap'
import styles from './HelpDialog.module.css'

export function HelpDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  const categories = useAppStore((s) => s.categories)
  // H2：查看對照的次數
  useEffect(() => {
    if (open) logEvent('help', { screen: useAppStore.getState().screen })
  }, [open])
  return (
    <Dialog open={open} title="快速整理" onClose={onClose} actions={<Button onClick={onClose}>關閉</Button>}>
      <dl className={styles.keys}>
        {categories.map((c) => (
          <div key={c.id}>
            <dt><Keycap code={c.key} /></dt>
            <dd>{c.name}</dd>
          </div>
        ))}
        <div><dt><Keycap code="ArrowLeft" /> <Keycap code="ArrowRight" /></dt><dd>切換照片</dd></div>
        <div><dt><Keycap code="KeyZ" /> 或 <Keycap code="KeyZ" label="⌘Z" /></dt><dd>撤回上一筆</dd></div>
        <div><dt><Keycap code="Space" /></dt><dd>放大照片</dd></div>
        <div><dt><Keycap code="Slash" /></dt><dd>打開這個說明</dd></div>
      </dl>
      <p className={styles.note}>照片只在你的電腦上處理，不會上傳。</p>
    </Dialog>
  )
}
