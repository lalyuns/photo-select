// 暫時的元件展示頁：用來確認 0-5 的樣式跟 Figma 一致。
// 之後會換成依 screen 切換 A／B／C／D 畫面。
import { Button } from './components/ui/Button'
import { Keycap } from './components/ui/Keycap'
import { glowOf } from './config/categoryColors'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const categories = useAppStore((s) => s.categories)

  return (
    <main
      style={{
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 40,
        background: 'linear-gradient(135deg, #eadfe6, #dde6ee)',
      }}
    >
      <div className="glass-panel" style={{ padding: 28, display: 'grid', gap: 24, maxWidth: 740 }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>元件展示</h1>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <Button variant="primary">開始整理</Button>
          <Button size="md">返回</Button>
          <Button variant="primary" size="sm">檢查結果</Button>
          <Button variant="ghost" size="sm">分類設定</Button>
          <Button variant="ghost" size="sm" disabled>
            撤回 <Keycap code="KeyZ" label="⌘Z" />
          </Button>
        </section>

        <nav
          className="glass"
          style={{ display: 'flex', gap: 4, padding: 5, borderRadius: 'var(--radius-tray)', width: 'fit-content' }}
        >
          {categories.map((c) => (
            <span
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                minHeight: 42,
                padding: '0 16px 0 10px',
                fontSize: 'var(--text-md)',
                fontWeight: 700,
              }}
            >
              <i
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: c.color,
                  boxShadow: `0 0 10px ${glowOf(c.color)}B3`,
                }}
              />
              <Keycap code={c.key} />
              {c.name}
            </span>
          ))}
        </nav>
      </div>
    </main>
  )
}
