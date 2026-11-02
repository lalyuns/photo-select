# 開發規則

## 資料夾

| 路徑 | 放什麼 |
|---|---|
| `src/types/` | 型別與介面（全組約定，改之前先在群組講） |
| `src/store/` | 全 App 狀態（useAppStore） |
| `src/config/` | 規則與常數（按鍵、顏色） |
| `src/sources/` | PhotoSource / ArchiveTarget 的實作（Mock、真資料夾） |
| `src/components/ui/` | 共用小元件（按鈕、按鍵小方塊、對話框、圖示） |
| `src/components/` | 共用大元件（Ambient 背景） |
| `src/hooks/` | 共用的 React hook（usePhotoUrl） |
| `src/screens/` | 各畫面，一個畫面一個檔案 |

## 畫面分工

`src/App.tsx` 只負責依 `screen` 切換畫面，**各軌道不用改它**，只改自己的畫面檔：

| 檔案 | 畫面 | Figma | 負責 |
|---|---|---|---|
| `StartScreen.tsx` | A 開始・選相冊 | 01 | 已完成（軌道 A 之後接上真的資料夾選擇） |
| `SetupScreen.tsx` | B 分類設定 | 02、03 | 軌道 C |
| `SortScreen.tsx` | C 連續整理 | 04～10 | 軌道 B |
| `ReviewScreen.tsx` | D 檢查結果 | 11、12 | 軌道 D |
| `DoneScreen.tsx` | 完成 | 13 | 軌道 D |

目前 B～完成都是 `Placeholder` 佔位，做正式畫面時整個換掉即可。

## 命名

- 元件檔：大寫開頭，`SortScreen.tsx`
- 其他檔：小寫開頭，`keys.ts`
- 只引入型別時用 `import type`

## 一定要遵守

1. **畫面元件不直接呼叫 Chrome 檔案 API**（`showDirectoryPicker` 等），一律透過 `PhotoSource` / `ArchiveTarget`。
2. **快捷鍵一律存 `event.code`**，判斷按鍵一律用 `src/config/keys.ts` 的 `resolveKey()`。
3. **保留鍵**：空白鍵、方向鍵、Esc、Z、?、Enter、Tab、Delete 不能指定給分類。
4. **分類鍵只允許 A–Z、0–9**；數字鍵盤視同上排數字。
5. 測試用 **Chrome**。Brave 預設關閉檔案存取功能。
6. CSS **不要手寫 `-webkit-` 前綴**（例如 `-webkit-backdrop-filter`）。打包工具會自動加，手寫反而會讓 Chrome 的版本被刪掉。
7. 顏色、圓角、字級一律用 `src/styles/tokens.css` 的變數，不寫死數字。

## 分支與上傳

- `main` 隨時都要能正常部署，不直接在 `main` 上開發。
- 每個功能開一條分支：`feature/<軌道>-<功能>`，例如 `feature/b2-keyboard`。
- 上傳前一定先跑 `npm run build`，通過才 push。
- 完成後在 GitHub 開 Pull Request，至少一位組員看過再合併。

## Commit 訊息

英文動詞開頭，說明做了什麼：

- `Add category settings screen`
- `Fix undo after reassign`
