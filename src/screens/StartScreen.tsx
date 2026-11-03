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
import { createMockPhotoSource } from '../sources/MockPhotoSource'
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
      setDialog('local')
      return
    }
    try {
      const dir = await pickDirectory('source')
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
