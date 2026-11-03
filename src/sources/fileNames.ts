// 檔名相關的規則：Mock 和之後的真資料夾實作共用，確保兩邊行為一致。

const SUPPORTED = new Set(['jpg', 'jpeg', 'png'])
const HEIC = new Set(['heic', 'heif'])
const RAW = new Set(['arw', 'cr2', 'cr3', 'nef', 'raf', 'dng', 'orf', 'rw2'])

export type FileKind = 'supported' | 'heic' | 'raw' | 'other' | 'hidden'

/** 取得小寫副檔名：'IMG_1.JPG' → 'jpg' */
export function extOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** 判斷檔案類型。以 . 開頭的是隱藏檔（.DS_Store、SD 卡產生的 ._IMG_1.JPG） */
export function classifyFile(name: string): FileKind {
  if (name.startsWith('.')) return 'hidden'
  const ext = extOf(name)
  if (SUPPORTED.has(ext)) return 'supported'
  if (HEIC.has(ext)) return 'heic'
  if (RAW.has(ext)) return 'raw'
  return 'other'
}

/** 檔名自然排序：IMG_2.jpg 排在 IMG_10.jpg 前面 */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

/** 把一堆檔名分成「可以整理的」和「不支援格式的統計」 */
export function summarizeNames(names: string[]): {
  supported: string[]
  unsupported: Record<string, number>
} {
  const supported: string[] = []
  const unsupported: Record<string, number> = {}
  for (const name of names) {
    const kind = classifyFile(name)
    if (kind === 'supported') supported.push(name)
    else if (kind === 'heic' || kind === 'raw') unsupported[kind] = (unsupported[kind] ?? 0) + 1
  }
  supported.sort(naturalCompare)
  return { supported, unsupported }
}

/**
 * 依 Finder 規則產生不重複的檔名，比對不分大小寫（Mac 的硬碟預設不分）：
 * IMG_2381.jpg → IMG_2381 2.jpg → IMG_2381 3.jpg
 * taken 放已存在檔名的小寫版本；產生的新名字也會自動加進去。
 */
export function uniqueName(name: string, taken: Set<string>): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let candidate = name
  let n = 2
  while (taken.has(candidate.toLowerCase())) {
    candidate = `${base} ${n}${ext}`
    n++
  }
  taken.add(candidate.toLowerCase())
  return candidate
}

/** 把不支援格式的統計變成一句話：{ heic: 3, raw: 4 } → 'HEIC 3 個、RAW 4 個' */
export function formatUnsupported(unsupported: Record<string, number>): string {
  const labels: Record<string, string> = { heic: 'HEIC', raw: 'RAW' }
  return Object.entries(unsupported)
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => `${labels[kind] ?? kind.toUpperCase()} ${n} 個`)
    .join('、')
}
