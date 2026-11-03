// 分類可用的顏色，來自 Figma 色點（七色）。dot 是點本身，glow 是外圈光暈。
export interface CategoryColor {
  name: string
  dot: string
  glow: string
}

export const CATEGORY_COLORS: readonly CategoryColor[] = [
  { name: '綠', dot: '#28B946', glow: '#32D74B' },
  { name: '紅', dot: '#FF3B30', glow: '#FF453A' },
  { name: '橘', dot: '#FF9500', glow: '#FF9F0A' },
  { name: '紫', dot: '#AF52DE', glow: '#BF5AF2' },
  { name: '藍', dot: '#007AFF', glow: '#0A84FF' },
  { name: '青', dot: '#2AA5C4', glow: '#40C8E0' },
  { name: '粉', dot: '#FF2D55', glow: '#FF375F' }, // Figma 03 第七個分類「搞笑表情」
]

/** 新增分類時，挑第一個還沒被用的顏色；全部用完就循環 */
export function pickColor(used: string[]): string {
  const free = CATEGORY_COLORS.find((c) => !used.includes(c.dot))
  return (free ?? CATEGORY_COLORS[used.length % CATEGORY_COLORS.length]).dot
}

/** 由色點顏色找光暈顏色 */
export function glowOf(dot: string): string {
  return CATEGORY_COLORS.find((c) => c.dot === dot)?.glow ?? dot
}

/** 換下一個顏色（設定畫面點色點時用） */
export function nextColor(current: string): string {
  const i = CATEGORY_COLORS.findIndex((c) => c.dot === current)
  return CATEGORY_COLORS[(i + 1) % CATEGORY_COLORS.length].dot
}
