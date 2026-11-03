// 小圖示：用 currentColor，跟著文字顏色變。
type IconName = 'folder' | 'lock' | 'back' | 'undo' | 'sliders'

interface Props {
  name: IconName
  size?: number
}

const PATHS: Record<IconName, string> = {
  folder: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2h9A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z',
  lock: 'M6.5 11h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  back: 'M14.5 6l-6 6 6 6',
  undo: 'M9 7L5 11l4 4M5 11h9a5 5 0 0 1 0 10h-2',
  sliders: 'M4 8h9M17 8h3M4 16h3M11 16h9M15 6v4M9 14v4',
}

export function Icon({ name, size = 17 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}
