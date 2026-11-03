# 照片篩選器

看一張、按一個鍵，照片就有了去處。用鍵盤快速把照片分到不同資料夾的網頁工具，照片只在自己的電腦上處理，不會上傳。

- 網站：https://lalyuns.github.io/photo-select/
- 需要 **Chrome 或 Edge**（要用到讀寫本機資料夾的功能）

## 開發

```bash
npm install       # 第一次，或 package.json 有變動時
npm run dev       # 開發伺服器：http://localhost:5173/photo-select/
npm run build     # 檢查型別並打包，push 前一定要過
```

push 到 `main` 後，GitHub Actions 會自動部署到上面的網址。

## 文件

- [開發規則與畫面分工](docs/CONVENTIONS.md)
- [使用者測試腳本](docs/USER-TEST.md)

## 測試資料與研究模式

```bash
npm run test-data -- ~/Desktop/照片篩選器測試 300
```

產生含特殊情況（中文檔名、壞檔、HEIC、RAW、同名檔）的測試資料夾。

網址加上 `?research=1` 會出現研究模式面板，可以手動記錄觀察、匯出事件紀錄（JSON）。

## 程式結構

| 資料夾 | 內容 |
|---|---|
| `src/screens/` | 五個畫面：開始、設定、整理、檢查、完成 |
| `src/components/` | 共用元件與各畫面的小元件 |
| `src/sources/` | 讀資料夾、歸檔、縮圖、預載、進度存檔 |
| `src/store/` | 全 App 狀態（Zustand） |
| `src/config/` | 按鍵規則、分類顏色 |
| `src/research/` | 事件紀錄與研究模式面板 |
| `src/types/` | 型別與介面 |
