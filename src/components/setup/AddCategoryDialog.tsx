// 新增分類（Figma「設定｜新增分類」）：輸入名稱，用推薦的按鍵，或按下自己想用的鍵。
import { useState } from 'react'
import { findConflict, isAssignable, keyLabel, suggestKey } from '../../config/keys'
import { useKeyCapture } from '../../hooks/useKeyCapture'
import { logEvent } from '../../research/eventLog'
import type { Category } from '../../types/model'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import styles from './Setup.module.css'

interface Props {
  open: boolean
  categories: Category[]
  onAdd(name: string, key: string): void
  onClose(): void
}

export function AddCategoryDialog({ open, categories, onAdd, onClose }: Props) {
  return open ? <AddCategoryForm categories={categories} onAdd={onAdd} onClose={onClose} /> : null
}

// 拆成內層元件：每次打開都是全新的狀態，不會留著上次輸入的名字
function AddCategoryForm({ categories, onAdd, onClose }: Omit<Props, 'open'>) {
  const [name, setName] = useState('')
  const [key, setKey] = useState(() => suggestKey(categories) ?? '')
  const [capturing, setCapturing] = useState(false)
  const [note, setNote] = useState('')

  useKeyCapture(
    capturing,
    (code) => {
      setCapturing(false)
      if (!isAssignable(code)) {
        setNote(`「${keyLabel(code)}」是系統功能鍵，請用 A–Z 或 0–9。`)
        return
      }
      const other = findConflict(categories, code)
      if (other) {
        logEvent('key_conflict', { where: 'add' })
        // Figma「設定｜快捷鍵衝突」：F 已分給「朋友美照」，換成未使用的 G
        setNote(`${keyLabel(code)} 已分給「${other.name}」，先用未使用的 ${keyLabel(key)}。`)
        return
      }
      setKey(code)
      setNote('')
    },
    () => setCapturing(false),
  )

  const trimmed = name.trim()
  const canAdd = trimmed !== '' && key !== ''
  const submit = () => canAdd && onAdd(trimmed, key)

  return (
    <Dialog
      open
      title="新增分類"
      onClose={onClose}
      actions={<Button onClick={onClose}>取消</Button>}
    >
      <label className={styles.nameBox}>
        <span>分類名稱</span>
        <input
          data-autofocus
          value={name}
          maxLength={20}
          placeholder="例如：搞笑表情"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
          }}
        />
      </label>
      <div className={styles.keyChoice}>
        <Button variant="primary" onClick={submit} disabled={!canAdd}>
          {key ? `${keyLabel(key)}　使用此鍵` : '沒有可用的按鍵'}
        </Button>
        <Button onClick={() => setCapturing(!capturing)}>
          {capturing ? '按下想用的鍵…（Esc 取消）' : '改用其他鍵'}
        </Button>
      </div>
      {note && <p className={styles.note}>{note}</p>}
    </Dialog>
  )
}
