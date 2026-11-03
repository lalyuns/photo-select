// 「按一個鍵來設定快捷鍵」：啟動後攔下下一次按鍵，不讓它觸發其他功能。
import { useEffect, useRef } from 'react'
import { normalizeCode } from '../config/keys'

const MODIFIERS = new Set(['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock'])

export function useKeyCapture(active: boolean, onKey: (code: string) => void, onCancel: () => void) {
  // 用 ref 存最新的 callback，監聽器就不用每次重新註冊
  const handlers = useRef({ onKey, onCancel })
  useEffect(() => {
    handlers.current = { onKey, onCancel }
  })

  useEffect(() => {
    if (!active) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.isComposing || MODIFIERS.has(e.code)) return // 單按 Shift 之類的不算
      e.preventDefault()
      e.stopPropagation() // 第三個參數 true：在最外層就攔下，對話框和其他快捷鍵都收不到
      if (e.code === 'Escape') handlers.current.onCancel()
      else handlers.current.onKey(normalizeCode(e.code))
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [active])
}
