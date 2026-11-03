// 歸檔流程（Figma「確認｜歸檔方式」之後）：選儲存位置 → 檢查位置 → 複製 → 結果。
// 瀏覽器不支援寫檔時，改用示範模式（MockArchiveTarget），流程一樣但不寫檔。
import { useRef, useState } from 'react'
import { planArchive, runArchive, type ArchiveJob, type ArchiveProgress, type ArchiveResult } from '../sources/archive'
import { createDirectoryArchiveTarget } from '../sources/DirectoryArchiveTarget'
import { isSameOrInside, pickDirectory, supportsFolderAccess } from '../sources/fsAccess'
import { createMockArchiveTarget } from '../sources/MockArchiveTarget'
import { logEvent } from '../research/eventLog'
import { useAppStore } from '../store/useAppStore'
import type { ArchiveSummary } from '../types/model'
import type { ArchiveTarget } from '../types/source'

export type ArchivePhase = 'idle' | 'confirm' | 'inside' | 'running' | 'failed' | 'error'

interface Pending {
  target: ArchiveTarget
  targetName: string
  simulated: boolean
}

export function useArchiveFlow() {
  const [phase, setPhase] = useState<ArchivePhase>('idle')
  const [progress, setProgress] = useState<ArchiveProgress>({ done: 0, total: 0 })
  const [summary, setSummary] = useState<ArchiveSummary | null>(null)
  const [error, setError] = useState('')
  const pending = useRef<Pending | null>(null)
  const failedJobs = useRef<ArchiveJob[]>([])
  const abort = useRef<AbortController | null>(null)

  /** 「確認」按下去之後：選儲存位置（一定要在點擊當下呼叫） */
  async function chooseTarget() {
    const { source } = useAppStore.getState()
    if (!source) return
    if (!supportsFolderAccess()) {
      pending.current = { target: createMockArchiveTarget().target, targetName: '示範（不寫檔）', simulated: true }
      return run()
    }
    try {
      const dir = await pickDirectory('archive')
      logEvent('picker', { purpose: 'archive', result: dir ? 'granted' : 'cancelled' })
      if (!dir) {
        setPhase('idle') // 使用者按了取消
        return
      }
      pending.current = { target: createDirectoryArchiveTarget(dir), targetName: dir.name, simulated: false }
      // 企劃 D4：存在照片資料夾裡面的話，下次掃描會把複本也讀進來
      if ('handle' in source && (await isSameOrInside(source.handle as FileSystemDirectoryHandle, dir))) {
        setPhase('inside')
        return
      }
      return run()
    } catch (e) {
      logEvent('picker', { purpose: 'archive', result: 'error' })
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
    }
  }

  /** 開始複製；retry = 只重做上一次失敗的那幾張 */
  async function run(retry = false) {
    const target = pending.current
    const { source, photos, assignments, categories, setArchiveResult, goTo } = useAppStore.getState()
    if (!target || !source) return

    const planned = planArchive(photos, assignments, categories)
    const jobs = retry ? failedJobs.current : planned.jobs
    abort.current = new AbortController()
    setPhase('running')
    setProgress({ done: 0, total: jobs.length })

    const result = await runArchive({
      jobs,
      source,
      target: target.target,
      signal: abort.current.signal,
      onProgress: setProgress,
    })

    failedJobs.current = result.failed.map(({ photo, folderName }) => ({ photo, folderName }))
    const next = merge(retry ? summary : null, result, {
      targetName: target.targetName,
      skipped: planned.skipped.length,
      simulated: target.simulated,
      stopped: abort.current.signal.aborted,
    })
    setSummary(next)
    setArchiveResult(next)
    logEvent('archive', { copied: next.copied, failed: next.failed.length, simulated: next.simulated, stopped: next.stopped })
    if (result.failed.length > 0) setPhase('failed')
    else {
      setPhase('idle')
      goTo('done')
    }
  }

  return {
    phase,
    progress,
    summary,
    error,
    open: () => setPhase('confirm'),
    close: () => setPhase('idle'),
    chooseTarget,
    proceedInside: () => run(),
    retryFailed: () => run(true),
    stop: () => abort.current?.abort(),
  }
}

/** 把這一次的結果整理成完成畫面要的摘要；重試時跟上一次的加在一起 */
function merge(
  previous: ArchiveSummary | null,
  result: ArchiveResult,
  meta: { targetName: string; skipped: number; simulated: boolean; stopped: boolean },
): ArchiveSummary {
  const byFolder = { ...(previous?.byFolder ?? {}) }
  for (const c of result.copied) byFolder[c.folderName] = (byFolder[c.folderName] ?? 0) + 1
  return {
    ...meta,
    byFolder,
    copied: (previous?.copied ?? 0) + result.copied.length,
    failed: result.failed.map((f) => ({ name: f.photo.name, reason: f.reason })),
  }
}
