// 快捷鍵規則：設定畫面（B）和整理畫面（C）共用。
// 一律使用 KeyboardEvent.code（實體按鍵位置），不受注音輸入法或鍵盤配置影響。
import type { Category } from '../types/model'

/** 系統保留鍵：不能指定給分類 */
export const RESERVED_CODES: ReadonlySet<string> = new Set([
  'Space',                                           // 放大
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', // 切換照片
  'Escape',                                          // 關閉放大、關閉視窗
  'KeyZ',                                            // Z／⌘Z 撤回
  'Slash',                                           // ?（Shift + /）開說明
  'Enter', 'Tab', 'Backspace',
])

/** 數字鍵盤視同上排數字：Numpad1 → Digit1 */
export function normalizeCode(code: string): string {
  const m = /^Numpad(\d)$/.exec(code)
  return m ? `Digit${m[1]}` : code
}

/** 這個鍵能不能指定給分類：只允許 A–Z、0–9，且不是保留鍵 */
export function isAssignable(code: string): boolean {
  return /^(Key[A-Z]|Digit\d)$/.test(code) && !RESERVED_CODES.has(code)
}

const SPECIAL_LABELS: Record<string, string> = {
  Space: '空白鍵', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Escape: 'Esc', Slash: '?', Enter: 'Enter', Tab: 'Tab', Backspace: 'Delete',
}

/** 畫面上按鍵小方塊要顯示的字：'KeyF' → 'F'、'Digit1' → '1' */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  return SPECIAL_LABELS[code] ?? code
}

/** 找出已經用了這個鍵的其他分類（設定畫面的衝突提示用） */
export function findConflict(
  categories: Category[],
  code: string,
  exceptId?: string,
): Category | undefined {
  return categories.find((c) => c.key === code && c.id !== exceptId)
}

/** 使用者正在輸入文字（例如改分類名稱）時，不觸發快捷鍵 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** 按下一個鍵代表的動作 */
export type KeyAction =
  | { type: 'assign'; categoryId: string }
  | { type: 'undo' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'zoom' }
  | { type: 'close' }
  | { type: 'help' }

/** 把鍵盤事件翻譯成動作；不相關的鍵回傳 null */
export function resolveKey(e: KeyboardEvent, categories: Category[]): KeyAction | null {
  if (e.isComposing || e.key === 'Process') return null   // 輸入法組字中
  if (isTypingTarget(e.target)) return null

  // Z 或 ⌘Z 撤回
  if (e.code === 'KeyZ' && !e.shiftKey && !e.altKey && !e.ctrlKey) return { type: 'undo' }

  // 其他組合鍵（⌘R、⌘C…）交給瀏覽器
  if (e.metaKey || e.ctrlKey || e.altKey) return null

  if (e.key === '?') return { type: 'help' }

  switch (e.code) {
    case 'ArrowRight': return { type: 'next' }
    case 'ArrowLeft': return { type: 'prev' }
    case 'Space': return { type: 'zoom' }
    case 'Escape': return { type: 'close' }
  }

  const code = normalizeCode(e.code)
  const category = categories.find((c) => c.key === code)
  return category ? { type: 'assign', categoryId: category.id } : null
}
