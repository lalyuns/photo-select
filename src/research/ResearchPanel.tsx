// 研究模式面板：網址加上 ?research=1 才會出現（?research=0 關閉），一般使用者看不到。
// 給帶使用者測試的組員用：手動記錄觀察、匯出事件紀錄。
import { useState, useSyncExternalStore } from 'react'
import { clearEvents, getEvents, logEvent, subscribeEvents } from './eventLog'
import styles from './ResearchPanel.module.css'
import { buildExport } from './summary'

const MODE_KEY = 'photo-select:research'
const PARTICIPANT_KEY = 'photo-select:participant'

function readFlag(): boolean {
  try {
    const param = new URLSearchParams(location.search).get('research')
    if (param !== null) sessionStorage.setItem(MODE_KEY, param === '0' ? '0' : '1')
    return sessionStorage.getItem(MODE_KEY) === '1'
  } catch {
    return false
  }
}

// 觀察者要手動記的事（企劃書 H3、H4、H5 只能靠觀察）
const NOTES = [
  { tag: 'H3-想搬移', label: '想搬移／想刪原檔' },
  { tag: 'H4-想放兩類', label: '想放進兩個分類' },
  { tag: 'H5-猶豫授權', label: '授權時猶豫' },
]

export function ResearchPanel() {
  const [enabled] = useState(readFlag)
  const [open, setOpen] = useState(false)
  const [participant, setParticipant] = useState(() => {
    try {
      return localStorage.getItem(PARTICIPANT_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [flash, setFlash] = useState('')
  const count = useSyncExternalStore(subscribeEvents, () => getEvents().length)

  if (!enabled) return null

  function done(message: string) {
    setFlash(message)
    setTimeout(() => setFlash(''), 1500)
    ;(document.activeElement as HTMLElement | null)?.blur() // 把焦點還給 App，方向鍵、空白鍵才不會按到面板
  }

  function exportJson() {
    const data = buildExport(getEvents(), participant || '未命名')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `photo-select-${participant || 'P'}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    done('已匯出')
  }

  if (!open) {
    return (
      <button type="button" className={`glass ${styles.pill}`} onClick={() => setOpen(true)}>
        研究模式 · {count}
      </button>
    )
  }

  return (
    <aside className={`glass-panel ${styles.panel}`} aria-label="研究模式">
      <header>
        <b>研究模式</b>
        <span>{count} 筆事件</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="收起">×</button>
      </header>
      <label>
        受測者代號
        <input
          value={participant}
          placeholder="P01"
          onChange={(e) => {
            setParticipant(e.target.value)
            try {
              localStorage.setItem(PARTICIPANT_KEY, e.target.value)
            } catch {
              // 存不了就只用這次
            }
          }}
        />
      </label>
      <p>觀察到就按一下：</p>
      <div className={styles.notes}>
        {NOTES.map((n) => (
          <button key={n.tag} type="button" onClick={() => { logEvent('note', { tag: n.tag }); done(`已記錄：${n.label}`) }}>
            {n.label}
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={exportJson}>匯出 JSON</button>
        <button
          type="button"
          onClick={() => {
            if (confirm('清除這台電腦上的所有事件紀錄？（建議先匯出）')) {
              clearEvents()
              done('已清除')
            }
          }}
        >
          清除紀錄
        </button>
      </div>
      {flash && <p className={styles.flash} role="status">{flash}</p>}
    </aside>
  )
}
