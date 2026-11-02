# 開發規則

## 資料夾

| 路徑 | 放什麼 |
|---|---|
| `src/types/` | 型別與介面（全組約定，改之前先在群組講） |
| `src/store/` | 全 App 狀態（useAppStore） |
| `src/config/` | 規則與常數（按鍵、顏色） |
| `src/sources/` | PhotoSource / ArchiveTarget 的實作（Mock、真資料夾） |
| `src/components/ui/` | 共用小元件（按鈕、按鍵小方塊） |
| `src/screens/` | 四個主畫面：Start、Setup、Sort、Review |

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

## 分支與上傳

- `main` 隨時都要能正常部署，不直接在 `main` 上開發。
- 每個功能開一條分支：`feature/<軌道>-<功能>`，例如 `feature/b2-keyboard`。
- 上傳前一定先跑 `npm run build`，通過才 push。
- 完成後在 GitHub 開 Pull Request，至少一位組員看過再合併。

## Commit 訊息

英文動詞開頭，說明做了什麼：

- `Add category settings screen`
- `Fix undo after reassign`
