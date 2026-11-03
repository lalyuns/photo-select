// 畫面 C：連續整理（Figma 04～10、放大｜照片、確認｜離開整理）
// 看一張、按一個鍵，照片就分好並跳到下一張。
import { useEffect, useRef, useState } from 'react'
import { Ambient } from '../components/Ambient'
import { HelpDialog } from '../components/HelpDialog'
import { BottomBar } from '../components/sort/BottomBar'
import { ProgressLine } from '../components/sort/ProgressLine'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Icon } from '../components/ui/Icon'
import { Keycap } from '../components/ui/Keycap'
import { resolveKey } from '../config/keys'
import { usePhotoWindow } from '../hooks/usePhotoWindow'
import { logEvent } from '../research/eventLog'
import { useAppStore } from '../store/useAppStore'
import styles from './SortScreen.module.css'

type Overlay = 'zoom' | 'help' | 'leave' | null

/** 先清掉再設回去，同一個分類連按兩次也會再閃一次 */
function flash(set: (id: string | null) => void, id: string) {
  set(null)
  requestAnimationFrame(() => set(id))
}

export function SortScreen() {
  const source = useAppStore((s) => s.source)
  const sourceLabel = useAppStore((s) => s.sourceLabel)
  const photos = useAppStore((s) => s.photos)
  const cursor = useAppStore((s) => s.cursor)
  const categories = useAppStore((s) => s.categories)
  const assignments = useAppStore((s) => s.assignments)
  const history = useAppStore((s) => s.history)
  // 動作函式不會變，直接從 store 拿
  const { assign, undo, next, prev, jumpTo, goTo } = useAppStore.getState()

  const current = photos[cursor]
  const { url, error, loading } = usePhotoWindow(source, photos, cursor)

  const [overlay, setOverlay] = useState<Overlay>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const overlayRef = useRef<Overlay>(null)
  useEffect(() => {
    overlayRef.current = overlay
    if (overlay === 'zoom') logEvent('zoom')
  }, [overlay])
  // 照片檔案壞掉、瀏覽器解不開時
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)

  // 分類並讓托盤上的按鈕閃一下
  function assignWithFeedback(categoryId: string) {
    assign(categoryId)
    flash(setFlashId, categoryId)
  }

  // 鍵盤：按鍵 → resolveKey 翻成動作 → store。對話框開著時交給對話框自己處理
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (overlayRef.current) return
      const { categories, assign, undo, next, prev } = useAppStore.getState()
      const action = resolveKey(e, categories)
      if (!action) return
      e.preventDefault()
      switch (action.type) {
        case 'assign': assign(action.categoryId); flash(setFlashId, action.categoryId); break
        case 'undo': undo(); break
        case 'next': next(); break
        case 'prev': prev(); break
        case 'zoom': setOverlay('zoom'); break
        case 'help': setOverlay('help'); break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const nameOf = (id?: string) => categories.find((c) => c.id === id)?.name
  const assignedCount = Object.keys(assignments).length
  const last = history.at(-1)

  // 狀態提示（Figma「狀態提示」）
  const currentName = current ? nameOf(assignments[current.id]) : undefined
  let message = '按分類鍵，接著看下一張。'
  if (photos.length > 0 && assignedCount === photos.length) message = `目前：${currentName}・全部分好了，可以檢查結果。`
  else if (last && last.cursor === cursor - 1) message = `上一張 → ${nameOf(last.next)}`
  else if (currentName) message = `目前：${currentName}`

  function leave() {
    if (history.length === 0) goTo('start')
    else setOverlay('leave')
  }

  return (
    <Ambient photo={url}>
      <div className={styles.page}>
        <ProgressLine
          photos={photos}
          assignments={assignments}
          categories={categories}
          cursor={cursor}
          onJump={jumpTo}
        />

        {/* 工具列/左：返回 + 相冊名稱 + 第幾張 */}
        <button type="button" className={`glass ${styles.back}`} onClick={leave}>
          <Icon name="back" />
          <b>{sourceLabel}</b>
          <span>{cursor + 1} / {photos.length}</span>
        </button>

        {/* 工具列/右 */}
        <div className={`glass ${styles.tools}`}>
          <button type="button" className={styles.tool} onClick={undo} disabled={history.length === 0}>
            <Icon name="undo" />
            撤回
            <Keycap code="KeyZ" label="⌘Z" />
          </button>
          <button type="button" className={styles.tool} onClick={() => goTo('setup')}>
            <Icon name="sliders" />
            分類設定
          </button>
          <Button variant="primary" size="sm" onClick={() => goTo('review')}>檢查結果</Button>
          <button type="button" className={styles.helpLink} onClick={() => setOverlay('help')}>說明</button>
        </div>

        {/* 目前照片 */}
        <figure className={styles.stage}>
          {error || (url && url === brokenUrl) ? (
            <p className={styles.error}>這張讀不到：{error ?? '檔案可能已損壞'}。可以照樣分類，或按 → 跳過。</p>
          ) : (
            url && (
              <img
                className={`${styles.photo} ${loading ? styles.loading : ''}`}
                src={url}
                alt={current?.name}
                onDoubleClick={() => setOverlay('zoom')}
                onError={() => setBrokenUrl(url)}
              />
            )
          )}
        </figure>

        {/* 狀態提示 */}
        <p className={`glass ${styles.status}`} aria-live="polite">
          <b>{current?.name}</b>
          <span>{message}</span>
          {history.length > 0 && (
            <button type="button" className={styles.statusUndo} onClick={undo}>撤回</button>
          )}
        </p>

        <BottomBar
          categories={categories}
          activeId={current ? assignments[current.id] : undefined}
          flashId={flashId}
          canPrev={cursor > 0}
          canNext={cursor < photos.length - 1}
          onAssign={assignWithFeedback}
          onPrev={prev}
          onNext={next}
          onZoom={() => setOverlay('zoom')}
          onHelp={() => setOverlay('help')}
        />
      </div>

      {/* Figma「放大｜照片」：空白鍵或 Esc 關閉 */}
      <Dialog
        open={overlay === 'zoom'}
        label={`放大：${current?.name ?? ''}`}
        size="wide"
        onClose={() => setOverlay(null)}
        actions={<Button size="lg" onClick={() => setOverlay(null)}>關閉 · Esc</Button>}
      >
        {url && <img className={styles.zoomed} src={url} alt={current?.name} />}
      </Dialog>

      <HelpDialog open={overlay === 'help'} onClose={() => setOverlay(null)} />

      {/* Figma「確認｜離開整理」 */}
      <Dialog
        open={overlay === 'leave'}
        title="要離開這組照片嗎？"
        onClose={() => setOverlay(null)}
        actions={
          <>
            <Button variant="primary" onClick={() => setOverlay(null)}>繼續整理</Button>
            <Button onClick={() => goTo('start')}>重新選擇相冊</Button>
          </>
        }
      >
        <p>尚未歸檔，已分好的 {assignedCount} 張會清掉。</p>
      </Dialog>
    </Ambient>
  )
}
