// 產生測試用的照片資料夾（軌道 E）。
//
// 用法：
//   npm run test-data -- <輸出位置> [張數]
//   npm run test-data -- ~/Desktop/照片篩選器測試 3000
//
// 會產生：
//   手機/      指定張數的 JPEG（IMG_0001.jpg…）＋各種特殊情況
//   相機B/     20 張跟「手機」同名的照片：歸檔到同一個位置時要自動改名，不能覆蓋
//   H1-100張/  固定 100 張，給 H1 計時用（Finder 和照片篩選器各整理一次）
import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , target, countArg] = process.argv
if (!target) {
  console.log('用法：npm run test-data -- <輸出位置> [張數，預設 300]')
  process.exit(1)
}
const count = Number(countArg ?? 300)
if (!Number.isInteger(count) || count < 1) {
  console.log('張數要是正整數')
  process.exit(1)
}

const root = resolve(target.replace(/^~(?=$|\/)/, homedir()))
const demoDir = fileURLToPath(new URL('../public/demo/', import.meta.url))
const samples = (await readdir(demoDir)).filter((n) => /\.jpe?g$/i.test(n)).map((n) => join(demoDir, n))
if (samples.length === 0) throw new Error('public/demo 裡沒有示範照片')

const pad = (n) => String(n).padStart(4, '0')
const sample = (i) => samples[i % samples.length]

async function copies(dir, n, name = (i) => `IMG_${pad(i + 1)}.jpg`) {
  await mkdir(dir, { recursive: true })
  for (let i = 0; i < n; i += 50) {
    await Promise.all(Array.from({ length: Math.min(50, n - i) }, (_, j) => copyFile(sample(i + j), join(dir, name(i + j)))))
  }
}

// 1. 手機：一般照片 + 特殊情況
const phone = join(root, '手機')
await copies(phone, count)
const special = {
  '貓咪 2026-11-03 下午.jpg': 'jpg',     // 中文和空白
  'photo (1).jpeg': 'jpg',               // 括號、.jpeg
  'IMG_0001 2.jpg': 'jpg',               // 看起來像已經改名過的
  'scan.PNG': 'jpg',                     // 大寫副檔名（內容其實是 JPEG，瀏覽器照樣讀得到）
  'broken.jpg': 'broken',                // 壞掉的檔案：要顯示「這張讀不到」，不能卡住
  '._IMG_0002.JPG': 'broken',            // SD 卡在 Mac 上留下的隱藏檔：要跳過
  '.DS_Store': 'broken',                 // Mac 隱藏檔：要跳過
  'notes.txt': 'text',                   // 不是照片：要跳過
}
for (const [name, kind] of Object.entries(special)) {
  if (kind === 'jpg') await copyFile(sample(0), join(phone, name))
  else if (kind === 'broken') await writeFile(join(phone, name), Buffer.from([0xff, 0xd8, 0x00, 0x01, 0x02]))
  else await writeFile(join(phone, name), '這不是照片')
}
// HEIC 與 RAW：只要副檔名對就好，內容不重要（H6：要被統計、跳過）
for (let i = 1; i <= 12; i++) await writeFile(join(phone, `IMG_${pad(9000 + i)}.HEIC`), 'fake heic')
for (let i = 1; i <= 8; i++) await writeFile(join(phone, `DSC0${pad(i)}.ARW`), 'fake raw')
// 子資料夾：目前只讀第一層，裡面的照片不該出現
await copies(join(phone, '子資料夾'), 3, (i) => `IMG_SUB_${i + 1}.jpg`)

// 2. 相機B：跟手機同名
await copies(join(root, '相機B'), 20)

// 3. H1 計時用：固定 100 張
await copies(join(root, 'H1-100張'), 100)

console.log(`完成：${root}
  手機/      ${count} 張 + 4 個特殊檔名 + 1 個壞檔 + 3 個該跳過的檔案 + HEIC 12 個 + RAW 8 個 + 子資料夾
  相機B/     20 張（檔名跟「手機」重複）
  H1-100張/  100 張

用照片篩選器打開「手機」應該看到：${count + 5} 張可整理（含 1 張讀不到）、HEIC 12 個、RAW 8 個暫不支援。`)
