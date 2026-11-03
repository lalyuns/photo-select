// 畫面 B：分類設定（Figma 02、03、設定｜快捷鍵衝突、設定｜新增分類、設定｜整理中修改）
// 先在「草稿」上改，按「開始整理／儲存並繼續」才真正存進 store；按返回／取消就不存。
import { useState, type CSSProperties } from 'react'
import { Ambient } from '../components/Ambient'
import { AddCategoryDialog } from '../components/setup/AddCategoryDialog'
import { KeyField } from '../components/setup/KeyField'
import styles from '../components/setup/Setup.module.css'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Icon } from '../components/ui/Icon'
import { glowOf, nextColor, pickColor } from '../config/categoryColors'
import { findConflict, isAssignable, keyLabel, suggestKey } from '../config/keys'
import { useKeyCapture } from '../hooks/useKeyCapture'
import { usePhotoUrl } from '../hooks/usePhotoUrl'
import { logEvent } from '../research/eventLog'
import { folderNameError, formatUnsupported } from '../sources/fileNames'
import { DEFAULT_CATEGORIES, useAppStore } from '../store/useAppStore'
import type { Category } from '../types/model'

const MAX_CATEGORIES = 10

/** 草稿裡的一列：多記一個「資料夾名稱是不是自己改過」，沒改過就跟著分類名稱走 */
interface Row extends Category {
  folderTouched: boolean
}

const toRows = (list: Category[]): Row[] => list.map((c) => ({ ...c, folderTouched: c.folderName !== c.name }))

interface Conflict {
  rowId: string
  code: string
  other: Category
  suggestion?: string
}

export function SetupScreen() {
  const saved = useAppStore((s) => s.categories)
  const photos = useAppStore((s) => s.photos)
  const source = useAppStore((s) => s.source)
  const sourceLabel = useAppStore((s) => s.sourceLabel)
  const unsupported = useAppStore((s) => s.unsupported)
  const assignments = useAppStore((s) => s.assignments)
  const prevScreen = useAppStore((s) => s.prevScreen)
  const { goTo, setCategories } = useAppStore.getState()

  // 從整理畫面進來 = Figma「設定｜整理中修改」：按鈕變成「取消／儲存並繼續」
  const midSort = prevScreen === 'sort'
  const backdrop = usePhotoUrl(source, photos[0]?.id)

  const [rows, setRows] = useState<Row[]>(() => toRows(saved))
  const [capturingId, setCapturingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [adding, setAdding] = useState(false)
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [confirmRemoval, setConfirmRemoval] = useState<string | null>(null)

  const update = (id: string, patch: Partial<Row>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  function rename(row: Row, name: string) {
    update(row.id, row.folderTouched ? { name } : { name, folderName: name })
  }

  // 按下新快捷鍵之後
  function applyKey(row: Row, code: string) {
    setCapturingId(null)
    if (code === row.key) return
    if (!isAssignable(code)) {
      setMessage({ text: `「${keyLabel(code)}」是系統功能鍵，請用 A–Z 或 0–9。`, error: true })
      return
    }
    const other = findConflict(rows, code, row.id)
    if (other) {
      logEvent('key_conflict', { where: 'row' })
      setConflict({ rowId: row.id, code, other, suggestion: suggestKey(rows, row.id) })
      return
    }
    update(row.id, { key: code })
    setMessage({ text: `「${row.name}」改用 ${keyLabel(code)}。` })
  }

  function addCategory(name: string, key: string) {
    const id = `c${Date.now().toString(36)}`
    const color = pickColor(rows.map((r) => r.color))
    setRows((list) => [...list, { id, name, key, color, folderName: name, folderTouched: false }])
    setAdding(false)
    setMessage({ text: `已新增「${name}」，快捷鍵 ${keyLabel(key)}。` })
  }

  function remove(row: Row) {
    setRows((list) => list.filter((r) => r.id !== row.id))
    setMessage({ text: `已移除「${row.name}」。` })
  }

  // 檢查草稿有沒有問題
  const problems: string[] = []
  rows.forEach((r, i) => {
    if (!r.name.trim()) problems.push(`第 ${i + 1} 列的分類名稱是空的`)
    const folderError = folderNameError(r.folderName)
    if (folderError) problems.push(`「${r.name || `第 ${i + 1} 列`}」：${folderError}`)
  })
  const folders = rows.map((r) => r.folderName.trim().toLowerCase())
  const dupFolder = folders.find((f, i) => f && folders.indexOf(f) !== i)
  if (dupFolder) problems.push(`有兩個分類都存到「${dupFolder}」資料夾`)

  // 整理到一半移除分類：有照片已經分進去的話，先提醒
  const counts = new Map<string, number>()
  for (const id of Object.values(assignments)) counts.set(id, (counts.get(id) ?? 0) + 1)
  const removedWithPhotos = saved.filter((c) => !rows.some((r) => r.id === c.id) && counts.get(c.id))

  function save(force = false) {
    if (problems.length) return
    if (!force && removedWithPhotos.length) {
      const total = removedWithPhotos.reduce((n, c) => n + (counts.get(c.id) ?? 0), 0)
      setConfirmRemoval(
        `移除「${removedWithPhotos.map((c) => c.name).join('」「')}」之後，已分進去的 ${total} 張會變回未分類，撤回紀錄也會清空。`,
      )
      return
    }
    setCategories(rows.map((r) => ({
      id: r.id, name: r.name.trim(), key: r.key, color: r.color, folderName: r.folderName.trim(),
    })))
    goTo('sort')
  }

  // 企劃 C3：有自訂分類時，提示「保留」可以移除
  const hasCustom = rows.some((r) => !DEFAULT_CATEGORIES.some((d) => d.id === r.id))
  const keepRow = rows.find((r) => r.id === 'keep')
  const skipped = formatUnsupported(unsupported)
  const subtitle =
    message?.text ??
    (hasCustom && keepRow ? `已有自訂分類，「${keepRow.name}」不需要的話可以移除。` : '一個分類、一個按鍵、一個資料夾。')

  return (
    <Ambient photo={backdrop.url}>
      <main className={styles.page}>
        <section className={`glass-panel ${styles.panel}`} aria-labelledby="setup-title">
          <header className={styles.header}>
            <h1 id="setup-title">分類與快捷鍵</h1>
            <p className={message?.error ? styles.error : undefined} aria-live="polite">{subtitle}</p>
            {!midSort && sourceLabel && (
              <p className={styles.source}>
                「{sourceLabel}」共 {photos.length} 張{skipped && `；另有 ${skipped}暫不支援，已略過`}。
              </p>
            )}
          </header>

          <div className={styles.table} role="table" aria-label="分類設定">
            <div className={`${styles.row} ${styles.head}`} role="row">
              <span role="columnheader" aria-label="顏色" />
              <span role="columnheader">分類名稱</span>
              <span role="columnheader">快捷鍵</span>
              <span role="columnheader">存到資料夾</span>
              <span role="columnheader" aria-label="移除" />
            </div>

            {rows.map((row) => (
              <div key={row.id} className={styles.row} role="row">
                <button
                  type="button"
                  className={styles.dot}
                  style={{ background: row.color, boxShadow: `0 0 8px ${glowOf(row.color)}66` } as CSSProperties}
                  onClick={() => update(row.id, { color: nextColor(row.color) })}
                  aria-label={`換「${row.name}」的顏色`}
                  title="換顏色"
                />
                <input
                  className={styles.field}
                  value={row.name}
                  maxLength={20}
                  onChange={(e) => rename(row, e.target.value)}
                  aria-label="分類名稱"
                />
                <KeyField
                  code={row.key}
                  capturing={capturingId === row.id}
                  onStart={() => setCapturingId(row.id)}
                  onStop={() => setCapturingId(null)}
                />
                <label className={`${styles.field} ${styles.folder}`}>
                  <Icon name="folder" size={16} />
                  <input
                    value={row.folderName}
                    maxLength={100}
                    onChange={(e) => update(row.id, { folderName: e.target.value, folderTouched: true })}
                    aria-label="資料夾名稱"
                  />
                </label>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => remove(row)}
                  disabled={rows.length <= 1}
                  aria-label={`移除「${row.name}」`}
                  title={rows.length <= 1 ? '至少要留一個分類' : '移除'}
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              className={styles.add}
              onClick={() => setAdding(true)}
              disabled={rows.length >= MAX_CATEGORIES}
            >
              <span aria-hidden="true">＋</span> 新增分類
            </button>
          </div>

          {problems.length > 0 && (
            <ul className={styles.problems} role="alert">
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}

          <div className={styles.rules}>
            <p>← → 切換 · Z／⌘Z 撤回 · 空白鍵放大</p>
            <p>設定可沿用；輸入文字時暫停分類快捷鍵。</p>
          </div>

          <footer className={styles.footer}>
            <span>
              設定可沿用到下一組照片。
              <button type="button" className={styles.reset} onClick={() => { setRows(toRows(DEFAULT_CATEGORIES)); setMessage({ text: '已恢復預設的三個分類，按下方按鈕後才會生效。' }) }}>
                恢復預設
              </button>
            </span>
            <span className={styles.actions}>
              <Button size="md" onClick={() => goTo(midSort ? 'sort' : 'start')}>{midSort ? '取消' : '返回'}</Button>
              <Button variant="primary" onClick={() => save()} disabled={problems.length > 0}>
                {midSort ? '儲存並繼續' : '開始整理'}
              </Button>
            </span>
          </footer>
        </section>
      </main>

      {/* 正在等待按鍵時，在背後抓那一次按鍵 */}
      <CaptureListener
        row={rows.find((r) => r.id === capturingId)}
        onKey={applyKey}
        onCancel={() => setCapturingId(null)}
      />

      <AddCategoryDialog open={adding} categories={rows} onAdd={addCategory} onClose={() => setAdding(false)} />

      {/* Figma「設定｜快捷鍵衝突」 */}
      <Dialog
        open={conflict !== null}
        title={conflict ? `${keyLabel(conflict.code)} 已分給「${conflict.other.name}」` : ''}
        onClose={() => setConflict(null)}
        actions={
          <>
            {conflict?.suggestion && (
              <Button
                variant="primary"
                onClick={() => {
                  const row = rows.find((r) => r.id === conflict.rowId)
                  update(conflict.rowId, { key: conflict.suggestion! })
                  setMessage({ text: `「${row?.name}」改用 ${keyLabel(conflict.suggestion!)}。` })
                  setConflict(null)
                }}
              >
                改用 {keyLabel(conflict.suggestion)}
              </Button>
            )}
            <Button onClick={() => setConflict(null)}>返回設定</Button>
          </>
        }
      >
        <p>{conflict?.suggestion ? `換成未使用的 ${keyLabel(conflict.suggestion)}。` : '請先換掉另一個分類的按鍵。'}</p>
      </Dialog>

      <Dialog
        open={confirmRemoval !== null}
        title="移除有照片的分類？"
        onClose={() => setConfirmRemoval(null)}
        actions={
          <>
            <Button variant="primary" onClick={() => { setConfirmRemoval(null); save(true) }}>仍要儲存</Button>
            <Button onClick={() => setConfirmRemoval(null)}>返回設定</Button>
          </>
        }
      >
        <p>{confirmRemoval}</p>
      </Dialog>
    </Ambient>
  )
}

// 抽成元件，才能依「目前在等哪一列」啟用或關閉按鍵攔截
function CaptureListener({ row, onKey, onCancel }: { row?: Row; onKey(row: Row, code: string): void; onCancel(): void }) {
  useKeyCapture(row !== undefined, (code) => row && onKey(row, code), onCancel)
  return null
}
