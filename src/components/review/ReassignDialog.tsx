// 修改分類（Figma「修改分類｜照片」）：看大一點的照片，點按鈕或按分類鍵改到別的分類。
import { useEffect } from 'react'
import { glowOf } from '../../config/categoryColors'
import { resolveKey } from '../../config/keys'
import { usePhotoUrl } from '../../hooks/usePhotoUrl'
import type { Category } from '../../types/model'
import type { PhotoEntry, PhotoSource } from '../../types/source'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Keycap } from '../ui/Keycap'
import styles from './Review.module.css'

interface Props {
  photo: PhotoEntry | null
  source: PhotoSource | null
  categories: Category[]
  currentId?: string
  onPick(categoryId: string): void
  onClose(): void
}

export function ReassignDialog({ photo, source, categories, currentId, onPick, onClose }: Props) {
  const { url } = usePhotoUrl(source, photo?.id)

  // 對話框開著時也能直接按分類鍵
  useEffect(() => {
    if (!photo) return
    function onKeyDown(e: KeyboardEvent) {
      const action = resolveKey(e, categories)
      if (action?.type !== 'assign') return
      e.preventDefault()
      e.stopPropagation()
      onPick(action.categoryId)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [photo, categories, onPick])

  const current = categories.find((c) => c.id === currentId)

  return (
    <Dialog
      open={photo !== null}
      title="這張放哪裡？"
      onClose={onClose}
      actions={<Button onClick={onClose}>{current ? '保留原分類' : '先不分類'}</Button>}
    >
      <div className={styles.reassignPhoto}>{url && <img src={url} alt={photo?.name} />}</div>
      <p className={styles.reassignCurrent}>{photo?.name}・目前：{current?.name ?? '未分類'}</p>
      <div className={styles.reassignChoices}>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.choice} ${c.id === currentId ? styles.choiceCurrent : ''}`}
            onClick={() => onPick(c.id)}
            disabled={c.id === currentId}
          >
            <i style={{ background: c.color, boxShadow: `0 0 8px ${glowOf(c.color)}99` }} />
            <Keycap code={c.key} />
            {c.id === currentId ? c.name : `改為${c.name}`}
          </button>
        ))}
      </div>
    </Dialog>
  )
}
