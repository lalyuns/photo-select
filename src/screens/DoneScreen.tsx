// 完成畫面（Figma 13）
// 負責：軌道 D。目前是佔位。
import { Button } from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'
import { Placeholder } from './Placeholder'

export function DoneScreen() {
  const goTo = useAppStore((s) => s.goTo)

  return (
    <Placeholder
      title="照片，各就各位。"
      track="軌道 D"
      figma="13"
      actions={
        <>
          <Button size="md" onClick={() => goTo('review')}>回看結果</Button>
          <Button variant="primary" onClick={() => goTo('start')}>再整理一組</Button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--ink-subtle)' }}>開發版：尚未寫入本機檔案。</p>
    </Placeholder>
  )
}
