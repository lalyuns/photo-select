// 把事件紀錄整理成每一輪（載入一批照片 = 一輪）的指標，對應企劃書 H1～H7。
import type { LogEvent } from './eventLog'

export interface SessionSummary {
  /** 第幾輪 */
  index: number
  startedAt: string
  /** folder：真的資料夾；demo：示範相冊 */
  source: string
  photoCount: number
  /** H6：跳過的格式 */
  unsupported: Record<string, number>
  /** H2：從進入設定到開始整理花了幾秒 */
  setupSeconds: number | null
  setupKeyConflicts: number
  customCategoryCount: number
  /** 接續過幾次（中途關掉又打開） */
  resumed: number
  /** H1：實際在分類的時間。兩次分類間隔超過 60 秒（休息、離開）只算 60 秒 */
  sortSeconds: number | null
  assigned: number
  secondsPerPhoto: number | null
  undo: number
  reassign: number
  zoom: number
  /** H2：查看說明的次數，以及前半段／後半段各幾次（後半段應該變少） */
  helpOpens: number
  helpOpensFirstHalf: number
  helpOpensSecondHalf: number
  /** 每個分類按了幾次 */
  categoryUses: Record<string, number>
  /** H7：已經有自訂分類時，還按「保留」幾次 */
  keepUsesWithCustom: number
  /** H5：選資料夾的結果 */
  pickers: { purpose: string; result: string }[]
  archive: { copied: number; failed: number; simulated: boolean; stopped: boolean } | null
  /** 觀察者手動記錄：H3 想搬移、H4 想放兩類、H5 猶豫授權 */
  notes: Record<string, number>
}

const seconds = (ms: number) => Math.round(ms / 100) / 10

const MAX_GAP = 60_000

interface Working {
  summary: SessionSummary
  setupEnteredAt: number | null
  assignTimes: number[]
  helpTimes: number[]
}

function emptySession(index: number, e: LogEvent): SessionSummary {
  return {
    index,
    startedAt: new Date(e.t).toISOString(),
    source: String(e.source),
    photoCount: Number(e.photoCount),
    unsupported: (e.unsupported as Record<string, number>) ?? {},
    setupSeconds: null,
    setupKeyConflicts: 0,
    customCategoryCount: 0,
    resumed: 0,
    sortSeconds: null,
    assigned: 0,
    secondsPerPhoto: null,
    undo: 0,
    reassign: 0,
    zoom: 0,
    helpOpens: 0,
    helpOpensFirstHalf: 0,
    helpOpensSecondHalf: 0,
    categoryUses: {},
    keepUsesWithCustom: 0,
    pickers: [],
    archive: null,
    notes: {},
  }
}

function finish({ summary, assignTimes, helpTimes }: Working): SessionSummary {
  if (assignTimes.length > 1) {
    let active = 0
    for (let i = 1; i < assignTimes.length; i++) active += Math.min(assignTimes[i] - assignTimes[i - 1], MAX_GAP)
    summary.sortSeconds = seconds(active)
    summary.secondsPerPhoto = seconds(active / (assignTimes.length - 1))
    // 以分類次數的一半為界，分前後半段（H2：查看說明的次數應該逐漸減少）
    const mid = assignTimes[Math.floor(assignTimes.length / 2)]
    summary.helpOpensFirstHalf = helpTimes.filter((t) => t < mid).length
    summary.helpOpensSecondHalf = helpTimes.filter((t) => t >= mid).length
  } else if (assignTimes.length === 1) {
    summary.sortSeconds = 0
  }
  return summary
}

export function summarize(events: readonly LogEvent[]): SessionSummary[] {
  const sessions: Working[] = []
  let current: Working | null = null
  let pendingPickers: { purpose: string; result: string }[] = []

  for (const e of events) {
    if (e.type === 'session') {
      current = { summary: emptySession(sessions.length + 1, e), setupEnteredAt: null, assignTimes: [], helpTimes: [] }
      current.summary.pickers = pendingPickers
      pendingPickers = []
      sessions.push(current)
      continue
    }
    // 接續上次：剛剛開的這一輪其實是上一輪的延續，併回去
    if (e.type === 'resume' && current && sessions.length > 1) {
      const previous = sessions[sessions.length - 2]
      previous.summary.pickers.push(...current.summary.pickers)
      previous.summary.resumed++
      sessions.pop()
      current = previous
      continue
    }
    // 選照片資料夾發生在載入照片之前，先暫存
    if (e.type === 'picker') {
      const entry = { purpose: String(e.purpose), result: String(e.result) }
      if (current && e.purpose === 'archive') current.summary.pickers.push(entry)
      else pendingPickers.push(entry)
      continue
    }
    if (!current) continue
    const s = current.summary
    switch (e.type) {
      case 'screen':
        if (e.to === 'setup' && current.setupEnteredAt === null) current.setupEnteredAt = e.t
        if (e.to === 'sort' && e.from === 'setup' && current.setupEnteredAt !== null && s.setupSeconds === null)
          s.setupSeconds = seconds(e.t - current.setupEnteredAt)
        break
      case 'categories':
        s.customCategoryCount = Number(e.custom ?? 0)
        break
      case 'key_conflict':
        s.setupKeyConflicts++
        break
      case 'assign': {
        s.assigned++
        current.assignTimes.push(e.t)
        const name = String(e.name)
        s.categoryUses[name] = (s.categoryUses[name] ?? 0) + 1
        if (e.category === 'keep' && e.custom) s.keepUsesWithCustom++
        break
      }
      case 'undo': s.undo++; break
      case 'reassign': s.reassign++; break
      case 'zoom': s.zoom++; break
      case 'help': s.helpOpens++; current.helpTimes.push(e.t); break
      case 'archive':
        s.archive = { copied: Number(e.copied), failed: Number(e.failed), simulated: Boolean(e.simulated), stopped: Boolean(e.stopped) }
        break
      case 'note': {
        const tag = String(e.tag)
        s.notes[tag] = (s.notes[tag] ?? 0) + 1
        break
      }
    }
  }
  return sessions.map((w, i) => ({ ...finish(w), index: i + 1 }))
}

/** 匯出用：事件原始資料 + 每輪摘要 */
export function buildExport(events: readonly LogEvent[], participant: string) {
  return {
    app: 'photo-select',
    participant,
    exportedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    sessions: summarize(events),
    events,
  }
}
