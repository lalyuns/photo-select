// 事件紀錄（軌道 E）：記下使用者的操作，用來驗證企劃書第八節的 H1～H7。
// 只存在這台電腦的瀏覽器裡，不會上傳；匯出成 JSON 後再由組員彙整。
// 不記檔名和資料夾名稱，只記張數、順序和時間。

export type EventType =
  | 'session'      // 載入一批照片
  | 'resume'       // 接續上次的進度（併回上一輪）
  | 'screen'       // 換畫面
  | 'assign'       // 分類一張
  | 'undo'         // 撤回
  | 'reassign'     // 在檢查畫面改分類
  | 'help'         // 打開快捷鍵說明（H2：查看對照的次數）
  | 'zoom'         // 放大照片
  | 'categories'   // 儲存分類設定
  | 'key_conflict' // 設定時按到已經用過的鍵
  | 'picker'       // 選資料夾（H5：授權）
  | 'archive'      // 歸檔結果
  | 'note'         // 觀察者手動記錄（H3、H4、H5）

export interface LogEvent {
  /** 時間（毫秒） */
  t: number
  type: EventType
  [key: string]: unknown
}

const STORAGE_KEY = 'photo-select:events'
const MAX_EVENTS = 20000

let events: LogEvent[] = load()
const listeners = new Set<() => void>()
let saveTimer: ReturnType<typeof setTimeout> | undefined

function load(): LogEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LogEvent[]) : []
  } catch {
    return [] // 無痕模式或被封鎖時，只記在記憶體裡
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // 存不進去（空間滿了）就算了，不影響使用
  }
}

export function logEvent(type: EventType, data: Record<string, unknown> = {}) {
  events.push({ t: Date.now(), type, ...data })
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS)
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 500) // 連續按鍵時不要每按一次就寫一次
  listeners.forEach((fn) => fn())
}

// 關閉或重新整理分頁前，把還沒寫進去的紀錄立刻存起來
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    clearTimeout(saveTimer)
    save()
  })
}

export function getEvents(): readonly LogEvent[] {
  return events
}

export function clearEvents() {
  events = []
  save()
  listeners.forEach((fn) => fn())
}

/** 研究面板用：事件數量變化時通知 */
export function subscribeEvents(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
