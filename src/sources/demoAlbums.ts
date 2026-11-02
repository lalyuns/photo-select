// 示範相冊：對應 Figma 畫面 A 的五個相冊。照片檔放在 public/demo/。

export interface DemoAlbum {
  id: string
  label: string
  files: string[]
}

const WEEK = [
  'IMG_2381.jpg', 'IMG_2384.jpg', 'IMG_2402.jpg', 'IMG_2405.jpg',
  'IMG_2431.jpg', 'IMG_2436.jpg', 'IMG_2440.jpg',
]

export const DEMO_ALBUMS: DemoAlbum[] = [
  { id: 'week', label: '這週的手機照片', files: WEEK },
  { id: 'friends', label: '朋友聚會', files: ['IMG_2381.jpg', 'IMG_2384.jpg'] },
  { id: 'cats', label: '貓咪日常', files: ['IMG_2402.jpg', 'IMG_2405.jpg'] },
  { id: 'trip', label: '週末旅行', files: ['IMG_2431.jpg', 'IMG_2436.jpg', 'IMG_2440.jpg'] },
  // RAW 檔不需要真的存在：scan() 只看副檔名就會把它們算進「不支援」
  { id: 'raw', label: '相機 RAW 備份', files: ['DSC00412.ARW', 'DSC00413.ARW', 'DSC00414.ARW', 'DSC00415.ARW'] },
]
