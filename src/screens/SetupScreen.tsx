// 畫面 B：分類設定（Figma 02、03、設定｜快捷鍵衝突、設定｜新增分類）
// 負責：軌道 C。目前是佔位，只列出現有分類。
import { Button } from '../components/ui/Button'
import { Keycap } from '../components/ui/Keycap'
import { formatUnsupported } from '../sources/fileNames'
import { useAppStore } from '../store/useAppStore'
import { Placeholder } from './Placeholder'

export function SetupScreen() {
  const categories = useAppStore((s) => s.categories)
  const photos = useAppStore((s) => s.photos)
  const sourceLabel = useAppStore((s) => s.sourceLabel)
  const unsupported = useAppStore((s) => s.unsupported)
  const skipped = formatUnsupported(unsupported)
  const goTo = useAppStore((s) => s.goTo)

  return (
    <Placeholder
      title="分類與快捷鍵"
      track="軌道 C"
      figma="02、03"
      actions={
        <>
          <Button size="md" onClick={() => goTo('start')}>返回</Button>
          <Button variant="primary" onClick={() => goTo('sort')}>開始整理</Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>
        已選「{sourceLabel}」，共 {photos.length} 張。
        {skipped && `另有 ${skipped}暫不支援，已略過。`}
      </p>
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
        {categories.map((c) => (
          <li key={c.id}>
            <Keycap code={c.key} /> {c.name} → 資料夾「{c.folderName}」
          </li>
        ))}
      </ul>
    </Placeholder>
  )
}
