// 畫面 A：開始・選相冊（Figma 01）。
// 「選擇照片資料夾」目前先跳出說明、改用示範照片；軌道 A 完成後換成真的資料夾選擇。
import { useEffect, useState } from 'react'
import { Ambient } from '../components/Ambient'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Icon } from '../components/ui/Icon'
import { Keycap } from '../components/ui/Keycap'
import { DEMO_ALBUMS, demoUrl, type DemoAlbum } from '../sources/demoAlbums'
import { createMockPhotoSource } from '../sources/MockPhotoSource'
import { useAppStore } from '../store/useAppStore'
import styles from './StartScreen.module.css'

interface AlbumCard {
  album: DemoAlbum
  photoCount: number
  skippedCount: number
}

type OpenDialog = 'local' | 'unsupported' | 'help' | null

export function StartScreen() {
  const categories = useAppStore((s) => s.categories)
  const [cards, setCards] = useState<AlbumCard[]>([])
  const [dialog, setDialog] = useState<OpenDialog>(null)

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
    const { photos } = await source.scan()
    if (photos.length === 0) {
      setDialog('unsupported')
      return
    }
    const { loadPhotos, goTo } = useAppStore.getState()
    loadPhotos(source, photos)
    goTo('setup')
  }

  return (
    <Ambient photo={demoUrl('IMG_2381.jpg')}>
      <main className={styles.page}>
        <p className={styles.brand}>照片篩選器</p>
        <h1 className={styles.hero}>一張接一張，整理不中斷。</h1>
        <p className={styles.lead}>選一個資料夾，看一張、按一個鍵，照片就有了去處。</p>

        <div className={styles.cta}>
          <Button variant="primary" className={styles.pick} onClick={() => setDialog('local')}>
            <Icon name="folder" />
            選擇照片資料夾
          </Button>
          <span className={styles.hint}>支援 JPEG、PNG</span>
        </div>

        <p className={styles.privacy}>
          <Icon name="lock" size={15} />
          <b>照片留在本機，免上傳。</b>
          <span>開發版 · 目前使用示範照片，不會讀寫本機檔案。</span>
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

      {/* Figma「說明｜選擇本機照片」 */}
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
        <p>正式版由 Chrome 授權讀取。</p>
        <p>這裡先使用示範照片。</p>
      </Dialog>

      {/* Figma「提示｜沒有支援格式」 */}
      <Dialog
        open={dialog === 'unsupported'}
        title="沒有支援的照片"
        onClose={() => setDialog(null)}
        actions={<Button variant="primary" onClick={() => setDialog(null)}>重新選擇</Button>}
      >
        <p>目前支援 JPEG、PNG；請選其他相冊。</p>
      </Dialog>

      {/* Figma「說明｜快捷鍵與原型範圍」；分類鍵依目前設定產生 */}
      <Dialog
        open={dialog === 'help'}
        title="快速整理"
        onClose={() => setDialog(null)}
        actions={<Button onClick={() => setDialog(null)}>關閉</Button>}
      >
        <dl className={styles.keys}>
          {categories.map((c) => (
            <div key={c.id}>
              <dt><Keycap code={c.key} /></dt>
              <dd>{c.name}</dd>
            </div>
          ))}
          <div><dt><Keycap code="ArrowLeft" /> <Keycap code="ArrowRight" /></dt><dd>切換照片</dd></div>
          <div><dt><Keycap code="KeyZ" /> 或 <Keycap code="KeyZ" label="⌘Z" /></dt><dd>撤回上一筆</dd></div>
          <div><dt><Keycap code="Space" /></dt><dd>放大照片</dd></div>
        </dl>
        <p className={styles.note}>開發版：資料夾選擇與歸檔尚未接上，不會讀寫本機檔案。</p>
      </Dialog>
    </Ambient>
  )
}
