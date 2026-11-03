// 畫面 A：開始・選相冊（Figma 01）。
// 「選擇照片資料夾」用 Chrome 讀取本機資料夾；不支援的瀏覽器改提示用示範照片。
import { useEffect, useState } from 'react'
import { Ambient } from '../components/Ambient'
import { HelpDialog } from '../components/HelpDialog'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Icon } from '../components/ui/Icon'
import { DEMO_ALBUMS, demoUrl, type DemoAlbum } from '../sources/demoAlbums'
import { createDirectoryPhotoSource } from '../sources/DirectoryPhotoSource'
import { formatUnsupported } from '../sources/fileNames'
import { pickDirectory, supportsFolderAccess } from '../sources/fsAccess'
import { clearProgress, loadProgress, type SavedProgress } from '../sources/progress'
import { createMockPhotoSource } from '../sources/MockPhotoSource'
import { logEvent } from '../research/eventLog'
import { useAppStore } from '../store/useAppStore'
import styles from './StartScreen.module.css'

interface AlbumCard {
  album: DemoAlbum
  photoCount: number
  skippedCount: number
}

type OpenDialog = 'local' | 'unsupported' | 'error' | 'help' | null

export function StartScreen() {
  const [cards, setCards] = useState<AlbumCard[]>([])
  const [dialog, setDialog] = useState<OpenDialog>(null)
  /** 對話框裡的補充說明，例如「HEIC 3 個、RAW 4 個」或錯誤訊息 */
  const [detail, setDetail] = useState('')
  const [scanning, setScanning] = useState(false)
  /** 上次整理到一半的進度（企劃 M4） */
  const [saved, setSaved] = useState<SavedProgress | null>(null)

  useEffect(() => {
    loadProgress().then((p) => p && setSaved(p))
  }, [])

  // 掃描每個示範相冊，算出張數
  useEffect(() => {
    Promise.all(
      DEMO_ALBUMS.map(async (album) => {
        const { photos, unsupported } = await createMockPhotoSource(album).scan()
        const skippedCount = Object.values(unsupported).reduce((a, b) => a + b, 0)
        return { album, photoCount: photos.length, skippedCount }
      }),
    ).then(setCards)
  }, [])

  // 接續上次：重新選同一個資料夾 → 掃描 → 只還原「同一張照片」的分類
  async function resume(progress: SavedProgress) {
    try {
      let source
      if (progress.kind === 'folder') {
        if (!supportsFolderAccess()) {
          setDialog('local')
          return
        }
        const dir = await pickDirectory('source')
        logEvent('picker', { purpose: 'source', result: dir ? 'granted' : 'cancelled', resume: true })
        if (!dir) return
        source = createDirectoryPhotoSource(dir)
      } else {
        const album = DEMO_ALBUMS.find((a) => a.id === progress.albumId)
        if (!album) throw new Error('找不到上次的示範相冊')
        source = createMockPhotoSource(album)
      }
      setScanning(true)
      const { photos, unsupported } = await source.scan()
      const same = new Map(photos.map((p) => [p.id, `${p.size}:${p.lastModified}`]))
      // 檔名一樣但大小或修改時間不同，代表已經換成別的照片，不還原
      const kept = Object.fromEntries(
        Object.entries(progress.assignments).filter(([id]) => same.get(id) === progress.fingerprints[id]),
      )
      if (Object.keys(kept).length === 0) {
        setDetail(`「${source.label}」裡找不到上次分過的照片，可能選錯資料夾了（上次是「${progress.label}」）。`)
        setDialog('error')
        return
      }
      const { loadPhotos, restoreProgress, goTo } = useAppStore.getState()
      loadPhotos(source, photos, unsupported)
      restoreProgress(kept, progress.cursor)
      goTo('sort')
    } catch (e) {
      setDetail(e instanceof Error ? e.message : String(e))
      setDialog('error')
    } finally {
      setScanning(false)
    }
  }

  async function openAlbum(album: DemoAlbum) {
    const source = createMockPhotoSource(album)
    const { photos, unsupported } = await source.scan()
    if (photos.length === 0) {
      setDetail(formatUnsupported(unsupported))
      setDialog('unsupported')
      return
    }
    const { loadPhotos, goTo } = useAppStore.getState()
    loadPhotos(source, photos, unsupported)
    goTo('setup')
  }

  // 選本機資料夾 → 掃描 → 進入分類設定
  async function openFolder() {
    if (!supportsFolderAccess()) {
      logEvent('picker', { purpose: 'source', result: 'unsupported' })
      setDialog('local')
      return
    }
    try {
      const dir = await pickDirectory('source')
      // H5：使用者願不願意授權
      logEvent('picker', { purpose: 'source', result: dir ? 'granted' : 'cancelled' })
      if (!dir) return // 使用者按了取消
      setScanning(true)
      const source = createDirectoryPhotoSource(dir)
      const { photos, unsupported } = await source.scan()
      if (photos.length === 0) {
        setDetail(formatUnsupported(unsupported))
        setDialog('unsupported')
        return
      }
      const { loadPhotos, goTo } = useAppStore.getState()
      loadPhotos(source, photos, unsupported)
      goTo('setup')
    } catch (e) {
      logEvent('picker', { purpose: 'source', result: 'error' })
      setDetail(e instanceof Error ? e.message : String(e))
      setDialog('error')
    } finally {
      setScanning(false)
    }
  }

  return (
    <Ambient photo={demoUrl('IMG_2381.jpg')}>
      <main className={styles.page}>
        <p className={styles.brand}>照片篩選器</p>
        <h1 className={styles.hero}>一張接一張，整理不中斷。</h1>
        <p className={styles.lead}>選一個資料夾，看一張、按一個鍵，照片就有了去處。</p>

        <div className={styles.cta}>
          <Button variant="primary" className={styles.pick} onClick={openFolder} disabled={scanning}>
            <Icon name="folder" />
            {scanning ? '掃描中…' : '選擇照片資料夾'}
          </Button>
          <span className={styles.hint}>支援 JPEG、PNG</span>
        </div>

        <p className={styles.privacy}>
          <Icon name="lock" size={15} />
          <b>照片留在本機，免上傳。</b>
          <span>只讀取你選的資料夾；歸檔時另存複本，原檔不動。</span>
        </p>

        {saved && (
          <div className={`glass ${styles.resume}`} role="region" aria-label="上次的進度">
            <span>
              <b>上次整理到一半：「{saved.label}」</b>
              已分 {saved.assigned} / {saved.photoCount} 張{saved.kind === 'folder' ? '（會請你再選一次這個資料夾）' : ''}・{new Date(saved.savedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <Button variant="primary" size="md" onClick={() => resume(saved)} disabled={scanning}>繼續整理</Button>
            <Button variant="ghost" size="md" onClick={() => { void clearProgress(); setSaved(null) }}>不用了</Button>
          </div>
        )}

        <p className={styles.or}>或選擇示範相冊</p>

        <ul className={styles.albums}>
          {cards.map(({ album, photoCount, skippedCount }) => (
            <li key={album.id}>
              <button
                type="button"
                className={`glass ${styles.album} ${album.cover ? '' : styles.textOnly}`}
                onClick={() => openAlbum(album)}
              >
                {album.cover && <img className={styles.cover} src={demoUrl(album.cover)} alt="" />}
                <span className={styles.meta}>
                  <b>{album.label}</b>
                  <span>
                    {photoCount > 0
                      ? `${photoCount} 張照片`
                      : `${skippedCount} 個檔案，沒有支援的格式`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className={styles.help} onClick={() => setDialog('help')}>
          說明
        </button>
      </main>

      {/* Figma「說明｜選擇本機照片」：瀏覽器不支援時才會出現 */}
      <Dialog
        open={dialog === 'local'}
        title="選擇本機照片"
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="primary" onClick={() => openAlbum(DEMO_ALBUMS[0])}>使用示範照片</Button>
            <Button onClick={() => setDialog(null)}>返回</Button>
          </>
        }
      >
        <p>讀取本機資料夾需要 Chrome 或 Edge。</p>
        <p>可以先用示範照片試試看。</p>
      </Dialog>

      {/* Figma「提示｜沒有支援格式」 */}
      <Dialog
        open={dialog === 'unsupported'}
        title="沒有支援的照片"
        onClose={() => setDialog(null)}
        actions={<Button variant="primary" onClick={() => setDialog(null)}>重新選擇</Button>}
      >
        <p>目前支援 JPEG、PNG；請選其他相冊。</p>
        {detail && <p>這裡有 {detail}，暫時無法整理。</p>}
      </Dialog>

      <Dialog
        open={dialog === 'error'}
        title="無法讀取這個資料夾"
        onClose={() => setDialog(null)}
        actions={<Button variant="primary" onClick={() => setDialog(null)}>重新選擇</Button>}
      >
        <p>{detail}</p>
      </Dialog>

      <HelpDialog open={dialog === 'help'} onClose={() => setDialog(null)} />
    </Ambient>
  )
}
