// App 的骨架：依 store 裡的 screen 顯示對應畫面。
// 各軌道只改自己的 src/screens/XxxScreen.tsx，不需要動這個檔案。
import type { ComponentType } from 'react'
import { useAutoSave } from './hooks/useAutoSave'
import { ResearchPanel } from './research/ResearchPanel'
import { useAppStore } from './store/useAppStore'
import type { Screen } from './types/model'
import { DoneScreen } from './screens/DoneScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { SetupScreen } from './screens/SetupScreen'
import { SortScreen } from './screens/SortScreen'
import { StartScreen } from './screens/StartScreen'

const SCREENS: Record<Screen, ComponentType> = {
  start: StartScreen,   // 畫面 A：已完成
  setup: SetupScreen,   // 畫面 B：軌道 C
  sort: SortScreen,     // 畫面 C：軌道 B
  review: ReviewScreen, // 畫面 D：軌道 D
  done: DoneScreen,     // 完成：軌道 D
}

export default function App() {
  const screen = useAppStore((s) => s.screen)
  useAutoSave()
  const Current = SCREENS[screen]
  return (
    <>
      <Current />
      <ResearchPanel />
    </>
  )
}
