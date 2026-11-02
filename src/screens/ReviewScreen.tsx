// 畫面 D：檢查結果（Figma 11、12、修改分類｜…、確認｜歸檔方式）
// 負責：軌道 D。目前是佔位：列出每張的分類。
import { Button } from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'
import { Placeholder } from './Placeholder'

export function ReviewScreen() {
  const photos = useAppStore((s) => s.photos)
  const categories = useAppStore((s) => s.categories)
  const assignments = useAppStore((s) => s.assignments)
  const goTo = useAppStore((s) => s.goTo)

  const nameOf = (id?: string) => categories.find((c) => c.id === id)?.name ?? '未分類'

  return (
    <Placeholder
      title="最後看一眼，再歸檔。"
      track="軌道 D"
      figma="11、12"
      actions={
        <>
          <Button size="md" onClick={() => goTo('sort')}>繼續整理</Button>
          <Button variant="primary" onClick={() => goTo('done')}>確認歸檔</Button>
        </>
      }
    >
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
        {photos.map((p) => (
          <li key={p.id}>{p.name} → {nameOf(assignments[p.id])}</li>
        ))}
      </ul>
    </Placeholder>
  )
}
